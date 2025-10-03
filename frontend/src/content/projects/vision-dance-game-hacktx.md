---
title: "Dance Dance Revolution"
slug: "vision-dance-game-hacktx"
summary: "Real-time dance game using OpenCV to track steps and score accuracy."
tech: ["Python", "OpenCV", "Computer Vision"]
date: "2024-10-20"
image: "BackgroundSubtraction.png"
order: 6
---
## Further Documentation can be found [here](https://docs.google.com/document/d/10ST1CDu-RMrBiT6ZRDH-5bf60puJRE4T4qnQjFSMDfI/edit?usp=sharing)

## Problem
- Build an engaging, low-latency dance game that recognizes foot placements without external sensors.

## Approach
- Background subtraction + blob detection for foot localization.
- Homography to map floor plane to game grid.
- Simple temporal smoothing and hit-window scoring.

![Background Subtraction form Camera Processing](/BackgroundSubtraction.png)

## Impact
- Functional 24-hr hackathon demo with stable tracking.
- Basis for future AR/vision interaction projects.

## Tech
- CV: segmentation, homography, morphology
- SW: Python, real-time loop optimization
- UX: hit timing windows and feedback cues