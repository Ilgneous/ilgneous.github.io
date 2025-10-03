---
title: "Surrogate ML Model for Magneto‑Hydrodynamics Prediction"
slug: "surrogate-ml-model-mhd"
summary: "Built an FNN surrogate to emulate MHD simulations with >98% fidelity, reducing turnaround to <20 minutes."
tech: ["Neural Network", "MATLAB", "Python"]

date: "2025-01-01"
order: 14
---
## Problem
Accelerate computationally expensive MHD simulations for rapid design iteration.

## Approach
- Collected simulation inputs/outputs and standardized features for learning.
- Trained a feed‑forward network surrogate to regress key MHD fields/metrics.
- Validated fidelity against reference runs and profiled end‑to‑end runtime.

## Impact
- Delivered >98% agreement on target metrics with orders‑of‑magnitude faster runtime.
- Enabled rapid HED design studies and parameter sweeps.

## Tech
- Modeling: FNN regressors, regularization, early stopping
- Tooling: MATLAB prototyping, Python packaging
