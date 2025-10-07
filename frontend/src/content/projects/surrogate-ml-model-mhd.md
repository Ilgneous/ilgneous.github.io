---
title: "Surrogate ML Model for Magneto‑Hydrodynamics Prediction"
slug: "surrogate-ml-model-mhd"
summary: "Built an FNN surrogate to emulate MHD simulations with >98% fidelity, reducing turnaround to <20 minutes."
tech: ["Neural Network", "MATLAB", "Python", "Plasma Physics", "Machine Learning", "Computational Physics", "Simulation"]

date: "2025-01-01"
image: "LBFGS.png"
order: 14
---
## Problem
Accelerate computationally expensive MHD simulations for rapid design iteration.

![Radial Implosion trajectory prediction from current pulses](/LBFGS.png)


## Approach
- Collected simulation inputs/outputs and standardized features for learning.
- Trained a feed‑forward network surrogate to regress key MHD fields/metrics.
- Validated fidelity against reference runs and profiled end‑to‑end runtime.

![Inverse Problem - Predicting Current Pulses from Radial Trajectories](/InverseProblem.png)
![Inverse Problem - Predicting Current Pulses from Radial Trajectories](/Inverse.png)


## Impact
- Delivered >98% agreement on target metrics with orders‑of‑magnitude faster runtime.
- Enabled rapid HED design studies and parameter sweeps.

## Tech
- Modeling: FNN regressors, regularization, early stopping
- Tooling: MATLAB prototyping, Python packaging
