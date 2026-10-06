"""
CSI Preprocessing Pipeline
==========================
Loads raw Wi-Fi CSI CSV files (complex-valued, 64 subcarriers per packet),
cleans them, removes noise, normalizes, and segments into fixed-length
time windows suitable for feature extraction / model input.

Dataset source (real, publicly available):
  cheeseBG/wifi-sensing - server/csi_dataset/domain_A
  https://github.com/cheeseBG/wifi-sensing
Classes present in this dataset: empty, sit, stand, walk, fall
(mapped below to: standing_empty->no_person handled separately, sitting,
standing, walking, falling)

NOTE: This public dataset does NOT contain "running" or "gesturing"
samples. We do not invent data for these classes. The pipeline and
model architecture are built to support adding them later once
labeled samples for those activities are available (see docs/dataset.md).
"""

import re
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.signal import medfilt

RAW_DIR = Path(__file__).resolve().parent.parent / "dataset" / "raw"
PROCESSED_DIR = Path(__file__).resolve().parent.parent / "dataset" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# activity -> label id
LABEL_MAP = {
    "empty": 0,   # no person / background
    "sit": 1,
    "stand": 2,
    "walk": 3,
    "fall": 4,
}
LABEL_NAMES = {v: k for k, v in LABEL_MAP.items()}

COMPLEX_RE = re.compile(r"\(([-\d.eE]+)([+-][\d.eE]+)j\)")

SUBCARRIER_COLS = [f"_{i}" for i in range(64)]


def _parse_complex_series(series: pd.Series) -> np.ndarray:
    """Parse a pandas Series of strings like '(-2060+6137j)' into complex128."""
    out = np.empty(len(series), dtype=np.complex128)
    for i, val in enumerate(series.values):
        if isinstance(val, complex):
            out[i] = val
            continue
        s = str(val).strip()
        try:
            out[i] = complex(s.replace("(", "").replace(")", ""))
        except ValueError:
            m = COMPLEX_RE.match(s)
            out[i] = complex(float(m.group(1)), float(m.group(2))) if m else 0j
    return out


def load_raw_csv(path: Path) -> np.ndarray:
    """Load one raw CSI csv file -> amplitude matrix [n_packets, 64]."""
    df = pd.read_csv(path)
    n = len(df)
    amp = np.zeros((n, len(SUBCARRIER_COLS)), dtype=np.float64)
    for j, col in enumerate(SUBCARRIER_COLS):
        c = _parse_complex_series(df[col])
        amp[:, j] = np.abs(c)  # amplitude = |CSI|
    return amp


def remove_noise(amp: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    """Median filter each subcarrier stream to strip impulsive noise/outliers."""
    cleaned = np.empty_like(amp)
    for j in range(amp.shape[1]):
        cleaned[:, j] = medfilt(amp[:, j], kernel_size=kernel_size)
    return cleaned


def normalize(amp: np.ndarray, mean=None, std=None):
    """Z-score normalize per subcarrier. Returns (normalized, mean, std)."""
    if mean is None:
        mean = amp.mean(axis=0)
    if std is None:
        std = amp.std(axis=0)
        std[std == 0] = 1e-8
    return (amp - mean) / std, mean, std


def segment_windows(amp: np.ndarray, window_size: int = 100, stride: int = 50):
    """Slice a [T, 64] amplitude matrix into overlapping windows [n_win, window_size, 64]."""
    n = amp.shape[0]
    windows = []
    for start in range(0, n - window_size + 1, stride):
        windows.append(amp[start:start + window_size])
    if not windows:
        return np.empty((0, window_size, amp.shape[1]))
    return np.stack(windows)


def normalize_window(window: np.ndarray) -> np.ndarray:
    """
    Per-window z-score normalization (per subcarrier, using only that
    window's own statistics). This is used consistently at BOTH training
    time and inference time, because in a real-time deployment the model
    only ever has access to the current window - it cannot use future or
    whole-stream statistics. Keeping train/inference identical here is
    what makes the saved model's accuracy numbers trustworthy at serving
    time.
    """
    mean = window.mean(axis=0)
    std = window.std(axis=0)
    std[std == 0] = 1e-8
    return (window - mean) / std


def build_dataset(window_size: int = 100, stride: int = 50, max_rows_per_class: int = 12000):
    """
    Full pipeline: for each activity csv -> load -> clean (denoise) ->
    segment into raw windows -> normalize EACH window independently.
    Returns X [n_windows, window_size, 64] and y [n_windows].
    Caps rows per class (esp. 'empty') so classes aren't wildly imbalanced.
    """
    all_windows, all_labels = [], []
    stats = {}
    for activity, label in LABEL_MAP.items():
        path = RAW_DIR / f"{activity}.csv"
        if not path.exists():
            continue
        amp = load_raw_csv(path)
        if len(amp) > max_rows_per_class:
            amp = amp[:max_rows_per_class]
        cleaned = remove_noise(amp)
        raw_windows = segment_windows(cleaned, window_size, stride)
        windows = np.stack([normalize_window(w) for w in raw_windows]) if len(raw_windows) else raw_windows
        all_windows.append(windows)
        all_labels.append(np.full(len(windows), label))
        stats[activity] = {"raw_packets": int(len(amp)), "windows": int(len(windows))}
        print(f"[preprocessing] {activity}: {len(amp)} packets -> {len(windows)} windows")

    X = np.concatenate(all_windows, axis=0)
    y = np.concatenate(all_labels, axis=0)

    np.save(PROCESSED_DIR / "X.npy", X)
    np.save(PROCESSED_DIR / "y.npy", y)

    # Also save the RAW (denoised, but not normalized) windows. These are
    # used by the demo/simulation service to mimic what a real CSI feed
    # would hand to the inference pipeline (which does its own denoise +
    # per-window normalization), rather than double-normalizing.
    raw_all = []
    for activity, label in LABEL_MAP.items():
        path = RAW_DIR / f"{activity}.csv"
        if not path.exists():
            continue
        amp = load_raw_csv(path)
        if len(amp) > max_rows_per_class:
            amp = amp[:max_rows_per_class]
        cleaned = remove_noise(amp)
        raw_windows = segment_windows(cleaned, window_size, stride)
        raw_all.append(raw_windows)
    X_raw = np.concatenate(raw_all, axis=0)
    np.save(PROCESSED_DIR / "X_raw.npy", X_raw)
    np.save(PROCESSED_DIR / "y_raw.npy", y)  # same labels/order
    print(f"[preprocessing] Final dataset: X={X.shape}, y={y.shape}")
    print(f"[preprocessing] Class distribution: "
          f"{ {LABEL_NAMES[l]: int((y == l).sum()) for l in np.unique(y)} }")
    return X, y, stats


if __name__ == "__main__":
    build_dataset()
