---
title: "Ping-Pong Balancer"
slug: "ping-pong-balancer"
summary: "3-axis platform that tracks and stabilizes a ping-pong ball in real time."
tech: ["OpenCV", "Python", "Dynamixel", "Control"]
date: "2025-05-01"
order: 2
---

## Problem
Keep a ping-pong ball centered on a moving 3-DoF platform with camera feedback, despite disturbances.

## Approach
- Camera → blob tracking → ball (x, y).
- Discrete controller (PID + damping) → platform angles.
- Dynamixel XM430s → inverse kinematics → commands @ 100 Hz.
- Latency budgeted with prediction on measured loop delay.

## Impact
- 0.8 s recovery from 5 cm step disturbance.
- < 2 mm RMS error at steady state.
- Real-time demo for outreach; reusable control framework.

## Tech
- Control: PID, feed-forward, latency compensation
- HW: XM430-W210-T, custom carbon parts
- SW: Python (control), Svelte (UI viz), Astro (site)
