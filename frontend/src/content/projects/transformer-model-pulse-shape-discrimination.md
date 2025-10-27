---
title: "Transformer Model for Pulse Shape Discrimination"
slug: "transformer-model-pulse-shape-discrimination"
summary: "Developed PSD for radioactive sources using a Transformer; achieved >98% classification accuracy on cleaned waveforms."
tech: ["Transformer", "Neural Network", "Signal Processing", "Python", "PyTorch", "Machine Learning"]

date: "2025-01-01"
image: "TransformerModel.png"
order: 12
---
## Problem
Differentiate radiation sources via scintillation/charge‑collection pulse shapes in noisy conditions.

## Approach
- Preprocessed raw waveforms (baseline correction, normalization, denoising) and curated training/validation splits.
- Designed a lightweight Transformer encoder for sequence classification of pulses with attention to temporal features.
- Benchmarked against classical PSD metrics and tuned thresholds for optimal detection performance.

## Impact
- Reached >98% accuracy on held‑out data, improving robustness over classical PSD baselines.
- Provided a modular PSD model for integration into detector DAQ pipelines.

## Tech
- ML: Transformer encoder, cross‑entropy objective
- Data: waveform cleaning, augmentation, stratified splits
