---
title: "Ping-Pong Balancer"
slug: "ping-pong-balancer"
summary: "A 3-axis robotic platform designed to track and stabilize a ping-pong ball in real time."
tech: ["OpenCV", "Python", "Dynamixel", "Controls", "CAD", "Raspberry Pi 5", "Inverse Kinematics"]
date: "2025-05-01"
order: 2
---

## Overview
This project aims to build a closed-loop robotic system capable of keeping a ping-pong ball centered on a 3-DoF tilting platform. The system uses a downward-facing camera for real-time ball localization and a set of Dynamixel actuators to manipulate platform orientation through inverse kinematics.

The project is currently under active development: 
<!-- the inverse kinematics framework is complete, all major hardware has been selected and ordered, and the mechanical CAD is nearing completion. -->

<!-- ## Current Progress -->
### ✓ Inverse Kinematics
A full geometric inverse kinematics model has been derived for the 3-axis platform, mapping desired platform pitch/roll angles to Dynamixel joint angles. The model incorporates joint limits, mechanical offsets, and platform geometry.

### ✓ Hardware Specification
- **Actuators:** 3× Dynamixel XM430-W210-T  
- **Controller:** Raspberry Pi 5  
- **Camera:** High-FPS USB global-shutter module (selected for low-latency tracking)  
- **Mechanical:** Custom platform with 3D-Printed components (design in progress)  

All components have been ordered and are scheduled for integration once the CAD assembly is finalized.

### ✓ CAD 
<!-- (In Progress) -->
The platform, motor mounts, and base structure are actively being modeled. The design focuses on:
- Low inertia and rigid structure  
- Minimizing backlash at the joints  
- Clean actuation geometry for accurate IK solutions  

## Planned Architecture
The control pipeline will follow this structure:

1. **Camera Module** → Real-time image thresholding / blob detection → ball (x, y)
2. **Control Loop** → PID + damping + prediction for loop-delay compensation
3. **IK Solver** → Convert platform target angles → motor joint angles
4. **Actuation** → Dynamixel commands at ~100–200 Hz
5. **UI** → Live visualization dashboard (Svelte + Astro)

<!-- ## Future Goals
When hardware is assembled, the primary goals are:
- Implement and tune the full control loop  
- Achieve stable tracking with <5 mm steady-state error  
- Demonstrate disturbance rejection (step pushes, impulses)  
- Build a polished interactive demo for outreach and portfolio documentation   -->

## Technologies
- **Control:** PID, feed-forward, latency compensation  
- **Hardware:** XM430-W210-T actuators, custom 3D-Printed platform  
- **Software:** Python (control + vision), OpenCV, Svelte UI, Astro site  
- **Computation:** Raspberry Pi 5 running the main control loop  

## Roadmap

### Phase 1 — Modeling & Foundations 
<!-- (✓ Completed) -->
- Derive full inverse kinematics for 3-DoF tilt platform  
- Validate kinematics in simulation and stress-test joint limits  
- Select actuators, compute torque margins, and finalize electronics stack  
- Order motors, camera, and Raspberry Pi 5  

### Phase 2 — Mechanical Design 
<!-- (In Progress) -->
- Complete CAD of platform, joints, and motor mounts  
- Prepare manufacturable drawings for carbon-fiber + printed components  
- Assemble first mechanical prototype and verify actuator fit-up  

### Phase 3 — Vision & Control Pipeline
- Implement real-time ball tracking (OpenCV blob tracking)  
- Build 100–200 Hz control loop (PID + damping + prediction)  
- Integrate latency measurement and compensation  
- Link controller output → IK solver → actuator commands  

### Phase 4 — System Integration & Tuning
- Bring up Dynamixel network and communication driver  
- Deploy control loop on Raspberry Pi 5  
- Tune gains for stability, overshoot, and fast recovery  
- Characterize system response to disturbances  

### Phase 5 — Demo & Documentation
- Produce repeatable balancing demo  
- Record performance metrics (RMS error, recovery time)  
- Build polished UI visualization (Svelte + Astro)  
- Finalize write-up, diagrams, and project video for website  

