---
title: "FSAE Steering System"
slug: "fsae-steering-system"
summary: "Redesigned Formula SAE steering system featuring carbon-fiber components, custom 3D-printed gearboxes, and optimized vehicle kinematics."
tech: ["SolidWorks", "FEA", "Carbon Fiber", "Metal 3D Printing", "CNC", "Vehicle Dynamics", "CAD"]
date: "2025-03-15"
order: 4
---

## Overview
This project involved a complete redesign of the Formula SAE steering system to reduce mass, improve steering precision, and refine vehicle handling behavior. The system transitioned from a traditional steel column and double-U-joint layout to a carbon-fiber column paired with compact, custom metal 3D-printed gearboxes. These changes reduced weight by **68%** while dramatically improving steering effort, compliance, and ergonomics.

The redesign also integrated significant kinematic modeling—including Ackermann tuning, bump-steer minimization, and understeer/oversteer balance optimization using the Milliken Moment Method—to maximize vehicle performance on track.

## Key Improvements
### ✓ Carbon-Fiber Steering Column
- Replaced previous steel column with a multi-layer CFRP tube.
- Achieved a **68% weight reduction** without sacrificing stiffness.
- Improved steering feel and reduced inertia in transient handling.

### ✓ Custom 3D-Printed Gearbox System
- Eliminated double-U-joint configuration in favor of compact, metal SLS-printed bevel gearboxes.
- Reduced required hand-over-hand steering and improved packaging within the nose cone.
- Increased column alignment accuracy and decreased compliance at the steering wheel.

### ✓ Vehicle Dynamics Modeling
- Simulated ideal **anti-Ackermann percentage** for max cornering efficiency.
- Applied the **Milliken Moment Method** to tune understeer vs. oversteer gradients.
- Modeled and iterated tie-rod geometry to **minimize bump steer** through full suspension travel.

### ✓ Steering Rack Selection
- Built a weighted decision matrix comparing commercial and custom rack options.
- Replaced heavy KAZ rack with a **lighter, tighter-tolerance NARRco rack**, improving packaging and steering response.

### ✓ Manufacturing & Validation
- Machined all housings, mounts, and interface components (CNC, lathe, manual).
- Designed and fabricated custom welding jigs for steering-column mounting plates.
- Performed lash measurement, gearbox alignment, and track-side reliability testing.

## Result
The final steering system achieved:
- **68% mass reduction** from the previous design  
- Lower steering effort and improved feedback  
- Reduced compliance and improved alignment accuracy  
- Better handling balance through optimized Ackermann and bump-steer characteristics  
- A more serviceable, modular steering assembly

## Tech
- **Design:** SolidWorks, full-system CAD, steering kinematics modeling  
- **Analysis:** FEA on gear housings, shafts, and CFRP column  
- **Fabrication:** Carbon-fiber layup, metal SLS, CNC machining, TIG fixture design  
- **Dynamics:** Milliken Moment Method, Ackermann modeling, bump-steer analysis

## Roadmap

### Phase 1 — Requirements & Concept Development (✓ Completed)
- Define steering ratio, compliance targets, and ergonomics constraints  
- Benchmark previous steel-column / double-U-joint system  
- Evaluate packaging limitations within nose cone and bulkhead  
- Create decision matrix for steering rack selection (KAZ → NARRco)

### Phase 2 — Kinematic & Vehicle Dynamics Modeling (✓ Completed)
- Compute ideal Ackermann / anti-Ackermann percentage  
- Perform tie-rod and upright geometry sweeps to minimize bump steer  
- Apply Milliken Moment Method to balance understeer/oversteer gradients  
- Determine steering effort, on-center behavior, and transient response targets  

### Phase 3 — Mechanical Redesign & Analysis (✓ Completed)
- Replace steel column with multi-layer CFRP tube  
- Replace double-U-joint chain with custom SLS-printed bevel gear gearboxes  
- Complete full-system CAD with mounts, housings, and interfaces  
- Run FEA on housings, shafts, and CFRP column for stiffness and safety factors  

### Phase 4 — Fabrication & Assembly (✓ Completed)
- CNC-machine gearbox housings, steering mounts, and interface components  
- Metal 3D print bevel gearboxes and perform fit/finish post-processing  
- Manufacture CFRP steering column  
- Design & fabricate welding jigs for mounting plates  
- Assemble full steering system and align gearboxes + column centerline  

### Phase 5 — Testing, Tuning & Validation (✓ Completed)
- Measure gearbox lash, bearing preload, and steering column compliance  
- Validate Ackermann and bump-steer characteristics on the assembled chassis  
- Track-test steering feel, effort, and transient handling  
- Verify manufacturability, serviceability, and long-term durability  

### Phase 6 — Documentation & Iteration (✓ Completed)
- Create detailed assembly documentation and service procedures  
- Archive CAD, FEA results, and design rationale for next year’s team  
- Identify future improvements: friction reduction, faster ratio options, modular mounts  

