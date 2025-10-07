---
title: "E-Bike Boost Converter"
summary: "Designed, simulated, and tested a high-efficiency DC-DC boost for an e-bike battery."
tech:
  - LTspice
  - KiCad
  - MCU
  - Power Electronics
date: "2025-03-15"
image: "BoostPCB.png"
order: 3
---

## Problem
Step up a battery pack to a regulated higher voltage with high efficiency and robust transient response for motor loads.

## Approach
- Set electrical requirements; inductor/diode/MOSFET sizing and switch-node loss estimates.
- LTspice sims: duty cycle, ripple, loop stability; compensation network design.
- PCB layout for tight current loops, Kelvin sensing, and thermal spreading.
- MCU PWM control (soft-start, OCP/OVP), test plan for line/load/thermal.

![PCB for Boost Converter](/BoostPCB.png)

## Impact
- Stable regulation across expected load range.
- Thermal performance verified on bench; reusable power stage for future robots.

## Tech
- Control: current-mode, compensation, soft-start
- HW: MOSFET gate drive, sense resistors, thermal vias
- SW: Embedded control for PWM & protections
