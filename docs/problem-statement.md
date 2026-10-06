# Problem Statement

## Existing Systems

Human activity recognition today is dominated by two approaches:

1. **CCTV / camera-based systems** — effective but privacy-invasive, blind
   in the dark or through occlusion, and expensive to deploy at scale.
2. **Wearable sensors** (accelerometers, smartwatches, fall-detection
   pendants) — accurate but depend on the user remembering to wear the
   device, and are unusable for people who refuse or forget to wear one
   (a common failure mode in elderly fall-detection deployments).

Both approaches also share deployment friction: cameras require line of
sight and lighting; wearables require compliance and battery upkeep.

## Proposed System

This project recognizes human activity from **Wi-Fi Channel State
Information (CSI)** — the way a person's body affects the amplitude and
phase of a Wi-Fi signal passing through a room. Because CSI is already
emitted by any commodity Wi-Fi router/receiver pair, this approach needs
**no cameras and no wearables**: sensing happens passively using RF
signals already present in most homes and buildings.

The system captures CSI amplitude data, runs it through a trained ML
pipeline, and classifies the activity of person(s) in the coverage area in
real time, surfacing results through a live dashboard with fall alerting.

## Why This Matters

- **Privacy-preserving**: no visual data is captured, only signal
  statistics.
- **Device-free**: nothing is worn or carried by the monitored person.
- **Always-on**: works in the dark, through non-metal walls, without line
  of sight.
- **Commodity hardware**: built on standard 802.11 CSI extraction, not
  specialized radar or LiDAR.

## Scope and Honesty Note

This is a final-year academic project, not a certified medical or safety
device. It is built with **real, published CSI data** and **real trained
models** (not hardcoded outputs), and clearly separates real inference
from demo/simulated data throughout — see `docs/dataset.md` and
`docs/ml-methodology.md` for exactly what is real vs. simulated.
