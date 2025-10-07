---
title: "Weather‑Damage Forecasting"
slug: "weather-damage-forecasting"
summary: "Predicted damage using LSTM‑based time‑series models; compared ARIMA, LSTM, and Transformer approaches."
tech: ["Python", "XGBoost", "PyTorch", "Predictive Analysis", "Data Visualization", "Data Analysis", "LSTM"]

date: "2025-01-01"
image: "WeatherForecasting.png"
order: 16
---
## Problem
Forecast weather‑driven damage risk to support insurance pricing and mitigation planning.

## Approach
- Engineered features from historical weather and claims data; handled seasonality and missing records.
- Trained LSTMs and compared against ARIMA and Transformer baselines with sliding‑window evaluation.
- Built visual dashboards for error analysis and scenario exploration.

![Weather Damage Visualization](/WeatherForecasting.png)

## Impact
- Achieved >98% accuracy on target labels in validation tests.
- Informed pricing strategies and resource allocation under forecast uncertainty.

## Tech
- Time‑series: supervised windows, cross‑validation
- Models: LSTM, ARIMA, Transformer; XGBoost for tabular blends
