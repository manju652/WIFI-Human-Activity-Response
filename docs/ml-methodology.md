# ML Methodology

## Pipeline

1. **Load** raw CSI CSVs (`ml/preprocessing.py::load_raw_csv`) — parses
   complex-valued subcarrier strings into a `[n_packets, 64]` amplitude
   matrix.
2. **Clean / denoise** — median filter (kernel size 5) per subcarrier
   stream, removing impulsive outliers.
3. **Segment** — sliding window, 100 packets per window, 50-packet
   stride (50% overlap).
4. **Normalize** — per-window z-score normalization per subcarrier.
   Applied identically at training time and inference time (this
   consistency was a deliberate fix — see `docs/architecture.md`).
5. **Feature extraction** (classical models only) — 18 aggregate
   statistics per window: time-domain (mean/std/max/min/range/skew/
   kurtosis/energy, each reduced to mean+std across subcarriers),
   temporal variation (mean/std of first difference — a movement
   proxy), and frequency-domain (FFT magnitude mean/std/max + dominant
   frequency bin of the averaged subcarrier signal).
6. **Train** four model families on an identical 75/25 train/test split
   (stratified, `random_state=42`), with a further 15% carved from
   training for validation (used by the deep models for early
   best-checkpoint selection):
   - **Random Forest** (200 trees, max depth 12, balanced class weights) — on extracted features
   - **SVM** (RBF kernel, C=10) — on extracted features
   - **CNN** (2 conv blocks + adaptive pooling) — on raw normalized windows
   - **LSTM** (single-layer, 64 hidden units) — on raw normalized windows
7. **Evaluate** every model on the same held-out test set: accuracy,
   weighted precision/recall/F1, and a full confusion matrix. Saved to
   `models/evaluation_report.json`.
8. **Select** the best model by weighted F1 on the test set (not
   validation — an honest held-out comparison).
9. **Save** all four trained models (not just the winner, for
   comparison/reproducibility) plus the feature scaler and metadata
   (`models/model_meta.json`).
10. **Inference** (`ml/inference.py`) loads only the winning model and
    exposes a single `predict_window()` call used everywhere downstream.

## Results (real, measured — not invented)

From an actual run against the real dataset described in
`docs/dataset.md` (744 total windows, 186 in the test set):

| Model | Test Accuracy | Weighted F1 |
|---|---|---|
| Random Forest | 89.8% | 0.900 |
| SVM | 93.0% | 0.931 |
| **CNN (selected)** | **97.9%** | **0.979** |
| LSTM | 91.9% | 0.919 |

Exact numbers, per-class precision/recall, and the full confusion matrix
for each model are in `models/evaluation_report.json` — regenerate them
yourself with `python ml/train.py`.

## Honesty Notes

- No accuracy figure in this document or in the dashboard is hardcoded —
  they come directly from `evaluation_report.json`, which you can
  regenerate.
- The dataset is modest in size (744 windows after segmentation), so
  these numbers should be read as "this pipeline works and this is what
  it measured on this dataset" rather than a claim of generalizable,
  clinical-grade accuracy. A larger, multi-environment CSI dataset would
  be needed before any real-world deployment claim.
- CNN winning is plausible given the dataset size and window structure,
  but re-running with a different random seed or more data could change
  the ranking — that's normal, and is exactly why the comparison step
  exists rather than picking one architecture up front.
