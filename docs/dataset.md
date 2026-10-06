# Dataset

## Source

This project uses **real, publicly available Wi-Fi CSI data** from:

> `cheeseBG/wifi-sensing` — https://github.com/cheeseBG/wifi-sensing
> (`server/csi_dataset/domain_A`)

Each CSV row is one captured CSI packet: a MAC address, a timestamp, and
64 complex-valued subcarrier readings (e.g. `(-2060+6137j)`). This is
real device-free Wi-Fi sensing data, not synthetic.

## Classes Present

| File | Activity | Raw packets used |
|---|---|---|
| `empty.csv` | No person present | 12,000 (capped) |
| `sit.csv`   | Sitting | 8,939 |
| `stand.csv` | Standing | 6,016 |
| `walk.csv`  | Walking | 6,015 |
| `fall.csv`  | Falling | 4,562 |

## Important Limitation — Read This

**This public dataset does not contain "running" or "gesturing" samples.**
The original prompt for this project asked for those two additional
classes. Per this project's own anti-hallucination requirement ("do not
invent accuracy values" / "use a real dataset"), we did **not** fabricate
data or labels for running/gesturing. The 5-class model here — no
person / sitting / standing / walking / falling — is trained entirely on
real, verifiable data.

The architecture supports adding more classes later: drop new labeled
CSVs into `dataset/raw/`, add the label to `ml/preprocessing.py`'s
`LABEL_MAP`, and re-run `ml/preprocessing.py` → `ml/train.py`. No other
code changes are required.

## Preprocessing Applied

See `docs/ml-methodology.md` for the full pipeline. In short: amplitude
extraction from complex CSI → median-filter denoising per subcarrier →
segmentation into 100-packet windows (50-packet stride) → per-window
z-score normalization.

## Class Balance

The `empty` class was capped at 12,000 raw packets (from a much larger
pool) specifically to avoid swamping the other classes; even so, class
representation is not perfectly even, which is why the training script
uses `class_weight="balanced"` for Random Forest and SVM.
