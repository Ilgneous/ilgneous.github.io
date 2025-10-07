---
title: "IR Optical UART Link"
slug: "ir-uart-link"
summary: "Half-duplex infrared data link implementing a lightweight UART-framed protocol over IR LED/photodiode."
tech: ["C++", "UART", "Oscilloscope", "PCB Design", "MCU", "KiCad"]
date: "2024-10-01"
image: "IRPCB.png"
order: 8
---
## Problem
Send robust serial data between two nodes without wires or RF modules in lab/robot settings.

![Wireless Data Transmission](/IRTransmission.jpg)

## Approach
- 38–56 kHz carrier modulation; UART framing with CRC.
- Ambient-light rejection and AGC via comparator threshold tuning.
- Scope-based eye diagram checks; BER tests vs. range/angle.

## Impact
- Reliable short-range link (line-of-sight) for debugging and control.
- Drop-in firmware library for other projects needing cable-free serial.

![PCB Design](/IRPCB.png)

## Tech
- HW: IR LED driver, photodiode transimpedance, carrier modulation
- SW: UART driver, CRC, framing/state machine