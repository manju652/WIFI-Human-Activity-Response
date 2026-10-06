"""
Feature Extraction
===================
Converts a segmented CSI window [window_size, n_subcarriers] into a
fixed-length feature vector for classical ML models (Random Forest, SVM).

Deep models (CNN/LSTM) consume the raw normalized window directly
(see train.py), so this module is only used for the classical models.
"""

import numpy as np
from scipy.stats import skew, kurtosis
from scipy.fft import rfft


def extract_features(window: np.ndarray) -> np.ndarray:
    """
    window: [T, n_subcarriers] normalized amplitude
    Returns a 1D feature vector aggregating time-domain statistics and
    frequency-domain energy across subcarriers.
    """
    # Aggregate across subcarriers -> single representative signal per stat,
    # plus per-subcarrier summary stats averaged, to keep vector length fixed
    # and informative without exploding dimensionality (64 subcarriers).
    feats = []

    # Time-domain stats per subcarrier, then reduced (mean/std across subcarriers)
    mean_sc = window.mean(axis=0)          # [64]
    std_sc = window.std(axis=0)            # [64]
    max_sc = window.max(axis=0)
    min_sc = window.min(axis=0)
    range_sc = max_sc - min_sc
    skew_sc = skew(window, axis=0, bias=False, nan_policy="omit")
    kurt_sc = kurtosis(window, axis=0, bias=False, nan_policy="omit")
    energy_sc = np.sum(window ** 2, axis=0) / window.shape[0]

    skew_sc = np.nan_to_num(skew_sc)
    kurt_sc = np.nan_to_num(kurt_sc)

    for arr in [mean_sc, std_sc, max_sc, min_sc, range_sc, skew_sc, kurt_sc, energy_sc]:
        feats.append(arr.mean())
        feats.append(arr.std())

    # Temporal variation: mean absolute first difference (movement proxy)
    diff = np.diff(window, axis=0)
    feats.append(np.mean(np.abs(diff)))
    feats.append(np.std(np.abs(diff)))

    # Frequency-domain: FFT magnitude of the mean-subcarrier signal
    mean_signal = window.mean(axis=1)  # [T]
    fft_mag = np.abs(rfft(mean_signal))
    feats.append(fft_mag.mean())
    feats.append(fft_mag.std())
    feats.append(fft_mag.max())
    dom_freq_idx = int(np.argmax(fft_mag[1:]) + 1) if len(fft_mag) > 1 else 0
    feats.append(float(dom_freq_idx))

    return np.array(feats, dtype=np.float64)


FEATURE_NAMES = (
    [f"{stat}_{agg}" for stat in
     ["mean", "std", "max", "min", "range", "skew", "kurt", "energy"]
     for agg in ["mean", "std"]]
    + ["diff_abs_mean", "diff_abs_std", "fft_mean", "fft_std", "fft_max", "fft_dom_freq_idx"]
)


def extract_features_batch(X: np.ndarray) -> np.ndarray:
    """X: [n_windows, T, n_subcarriers] -> [n_windows, n_features]"""
    return np.stack([extract_features(w) for w in X])


if __name__ == "__main__":
    from pathlib import Path
    base = Path(__file__).resolve().parent.parent / "dataset" / "processed"
    X = np.load(base / "X.npy")
    feats = extract_features_batch(X)
    np.save(base / "features.npy", feats)
    print(f"[features] {feats.shape[0]} windows -> {feats.shape[1]} features each")
    print(f"[features] names: {FEATURE_NAMES}")
