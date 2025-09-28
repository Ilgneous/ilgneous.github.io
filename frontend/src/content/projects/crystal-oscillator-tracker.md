---
title: "Crystal Oscillator Tracker"
slug: "crystal-oscillator-tracker"
summary: "MCU-based frequency tracker that measures crystal drift and stability using timer-capture and serial logging."
tech: ["MCU", "C", "Timers/Interrupts", "UART", "Signal Processing"]
date: "2024-11-01"
order: 7
---
## Problem
Characterize frequency drift and short-term stability of a reference crystal with low-cost hardware.

## Approach
- Timer capture on rising edges → period estimate with fractional averaging.
- Sliding-window outlier rejection; optional DFT-based refinement on edge timestamps.
- Serial logging to CSV; Python notebook for Allan-style stability plots.

## Impact
- Reliable drift trending for different crystals and temperatures.
- Reusable measurement firmware for future timing experiments.

## Tech
- HW: MCU timer/capture, level shifting, stable supply decoupling
- SW: C (interrupt-driven), Python analysis (pandas/numpy)