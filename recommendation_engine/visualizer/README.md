# TARS 2.0 Interactive Testing & Visual Dashboard

This directory contains the official interactive testing dashboard for the **Thrail App Recommendation System (TARS 2.0)**.

---

## 1. Files in this Directory

* **[tars_interactive_dashboard.html](file:///d:/thrail_app/recommendation_engine/visualizer/tars_interactive_dashboard.html)**: Interactive Web Dashboard for testing TARS 2.0 recommendations, all 23 benchmark configurations, 50-user presets, multi-user random comparative testing, and BCF profile updates.
* **[run_visualizer.py](file:///d:/thrail_app/recommendation_engine/visualizer/run_visualizer.py)**: Python launcher script that opens the dashboard in your default browser.

---

## 2. How to Launch the Dashboard

### Option A: Via Python Launcher Script

```powershell
cd recommendation_engine
python visualizer/run_visualizer.py
```

### Option B: Direct PowerShell Command

```powershell
cd recommendation_engine
Invoke-Item visualizer/tars_interactive_dashboard.html
```

---

## 3. Key Dashboard Capabilities

1. **Single User Custom Sandbox**:
   - Select any preset user (`user_001` to `user_050`) or type custom inputs.
   - Select any of the **23 TARS Strategy Configurations** (grouped under Hybrid, Content-Based, Collaborative Filtering, and Baseline Anchors).
   - Drag active users slider ($u = 1 \dots 100$) to observe $\alpha(u, m)$ blending ratio gauge live.
   - Simulate post-hike BCF ($\beta$) profile updates.

2. **Multi-User Comparison & Diversity Matrix (1 to 50 Users Slider)**:
   - Drag the slider ($1 \dots 50$) to evaluate multiple users simultaneously.
   - Click **"Pick Random N Users & Evaluate"** to compare unique mountain recommendations and match scores ($R_{tu}$) across random user groups.
