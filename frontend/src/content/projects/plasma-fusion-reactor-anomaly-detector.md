---
title: "Plasma Physics Fusion Reactor Anomaly Detector"
slug: "plasma-fusion-reactor-anomaly-detector"
summary: "Compared PCA+Random Forest and RNN approaches to detect instability periods in MIT tokamak data."
tech: ["Python", "XGBoost", "scikit-learn", "Kaggle", "Anomaly Detection", "Machine Learning", "PyTorch"]

date: "2025-01-01"
order: 22
---
## Problem
Detect anomalous operating periods indicating instability in tokamak time‑series data.

## Approach
- Preprocessed and standardized time‑series inputs; performed PCA for dimensionality reduction.
- Trained Random Forest anomaly detectors on principal components; evaluated against RNN baselines.
- Tuned detection thresholds for precision‑recall trade‑offs under class imbalance.

## Impact
- Identified instability windows with high recall while controlling false positives.
- Established a reproducible pipeline for future fusion data experiments.

## Tech
- ML: PCA + Random Forest, sequence models (RNN)
- Data: windowing, imbalance handling
