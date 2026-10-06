import numpy as np
from fastapi import APIRouter, HTTPException

from ..services.simulation import get_real_sample
from ..ml_pipeline import LABEL_NAMES

router = APIRouter(tags=["csi"])

# Keep payload small: show a handful of representative subcarriers rather
# than all 64, and downsample the time axis slightly for the frontend chart.
_DISPLAY_SUBCARRIERS = [0, 8, 16, 24, 32, 40, 48, 56]


@router.get("/api/csi-sample")
def csi_sample(activity: str | None = None):
    """
    Returns a REAL CSI window (denoised amplitude, not fabricated) plus a
    real FFT computed from it, for honest CSI Visualization panels. If
    `activity` is given, the sample is truly labeled as that class in the
    dataset (see docs/dataset.md).
    """
    if activity is not None and activity not in LABEL_NAMES.values():
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported activity '{activity}'. Supported: {list(LABEL_NAMES.values())}",
        )
    window, true_label = get_real_sample(activity)  # [T, 64] real denoised amplitude

    traces = {
        f"sc_{sc}": window[:, sc].round(2).tolist()
        for sc in _DISPLAY_SUBCARRIERS
    }

    mean_signal = window.mean(axis=1)
    fft_mag = np.abs(np.fft.rfft(mean_signal - mean_signal.mean()))
    fft_freqs = np.fft.rfftfreq(len(mean_signal), d=1.0)  # normalized units (per-packet)

    # small waterfall: [n_subcarrier_bands x time_bins], real amplitude, downsampled
    n_time_bins = 40
    bin_edges = np.linspace(0, window.shape[0], n_time_bins + 1).astype(int)
    waterfall = np.array([
        window[bin_edges[i]:bin_edges[i + 1]].mean(axis=0) if bin_edges[i + 1] > bin_edges[i] else window[bin_edges[i]]
        for i in range(n_time_bins)
    ])  # [n_time_bins, 64]

    return {
        "true_label": true_label,
        "window_size": int(window.shape[0]),
        "n_subcarriers": int(window.shape[1]),
        "traces": traces,
        "fft_magnitude": fft_mag.round(3).tolist(),
        "fft_freq": fft_freqs.round(4).tolist(),
        "waterfall": waterfall.round(2).tolist(),  # [40][64]
    }
