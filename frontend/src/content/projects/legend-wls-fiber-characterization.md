---
title: "WLS Fiber Characterization (LEGEND)"
slug: "legend-wls-fiber-characterization"
summary: "Measured emission spectra and attenuation of wavelength-shifting fibers to optimize scintillation readout."
tech: ["Optics", "SiPM", "Spectrometer", "Python", "DAQ"]
date: "2024-07-01"
image: "UVvBlueLED.png"
order: 5
---
## Problem
Quantify light yield and attenuation in WLS fibers for low-background detector readout.

![Normalized Emission Spectra Compared](/UVvBlueLED.png)

## Approach
- Spectral scans vs. excitation; cut-back method for attenuation length.
- SiPM coupling tests; fixture for repeatable alignment and distances.
- Python analysis to fit attenuation and compare fiber batches.

## Impact
- Data used to select fibers and routing for improved light collection.
- Reusable fixtures and scripts for ongoing detector R&D.

## Tech
- Optics: coupling, alignment, spectral measurement
- Sensors: SiPM biasing, dark-count handling
- SW: Python analysis notebooks, curve fitting