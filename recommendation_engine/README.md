# Thrail App Recommendation System (TARS 2.0) Microservice Guide

This directory houses the official **Thrail App Recommendation System (TARS 2.0)** microservice.

---

## 1. Project Directory Structure

All files relating to this microservice are organized into logical subdirectories inside [recommendation_engine/](file:///d:/thrail_app/recommendation_engine):

```
recommendation_engine/
│
├── core/                        <-- CORE RECOMMENDATION MODULES
│   ├── recommender.py           <-- HybridRecommender engine
│   ├── distance_strategies.py   <-- Strategy Pattern metrics (Gower, Euclidean, Cosine, 23 Configs)
│   ├── profile_manager.py       <-- 18-Feature mapping, P_e/P_d anchors, BCF updates
│   └── gower_engine.py          <-- Legacy Gower engine utility
│
├── data/                        <-- MOCK DATASETS
│   ├── trails_mock.csv          <-- Candidate trails dataset
│   └── user_ratings_mock.csv    <-- Historical user ratings and logs
│
├── visualizer/                  <-- INTERACTIVE TESTING & DASHBOARD
│   ├── tars_interactive_dashboard.html  <-- Live Web Dashboard (1 to 50 users slider & random tester)
│   ├── run_visualizer.py       <-- Dashboard launcher script
│   └── README.md
│
├── benchmarks/                  <-- BENCHMARK EVALUATOR & SCRATCHPAD
│   ├── benchmark_evaluator.py   <-- 23 Benchmark configurations evaluator
│   └── recommendation_scratchpad.ipynb <-- Interactive Jupyter prototyping scratchpad
│
├── tests/                       <-- AUTOMATED TESTS & API CLIENT
│   ├── test_tars_recommender.py <-- Unit test suite
│   └── test_client.py           <-- API test client
│
├── app.py                       <-- FastAPI Entry Point
├── requirements.txt             <-- Dependencies list
└── README.md                    <-- Service Documentation
```

---

## 2. First-Time Environment Setup (One-Time Setup)

Ensure you have Python 3.8+ installed, then run the following commands:

### Step 1: Create a virtual environment
```powershell
# Navigate to recommendation_engine directory
cd recommendation_engine

# Create the virtual environment
python -m venv venv
```

### Step 2: Activate the virtual environment
* **Windows PowerShell:**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **Windows Command Prompt (cmd):**
  ```cmd
  .\venv\Scripts\activate.bat
  ```
* **macOS/Linux Bash:**
  ```bash
  source venv/bin/activate
  ```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

---

## 3. Deactivating the Virtual Environment

When you are finished working in the Python virtual environment, run in **any terminal shell**:

```bash
deactivate
```

---

## 4. Quick Commands Reference

### Launch the FastAPI Microservice Server
```powershell
cd recommendation_engine
python app.py
```

### Launch the Interactive Testing Dashboard in Web Browser
```powershell
cd recommendation_engine
python visualizer/run_visualizer.py
```

### Run 23 Benchmark Configurations Evaluator
```powershell
cd recommendation_engine
python benchmarks/benchmark_evaluator.py
```

### Run Automated Unit Test Suite
```powershell
cd recommendation_engine
python -m unittest tests/test_tars_recommender.py
```

### Run API Test Client Script
```powershell
cd recommendation_engine
python tests/test_client.py
```

---

## 5. Running the Jupyter Notebook Scratchpad

When running [recommendation_scratchpad.ipynb](file:///d:/thrail_app/recommendation_engine/benchmarks/recommendation_scratchpad.ipynb):

### Method 1: Inside VS Code (Recommended)
1. Double-click `benchmarks/recommendation_scratchpad.ipynb`.
2. Click **Select Kernel** in the top-right corner of the notebook editor window.
3. Choose **Python Environments...** and select your virtual environment Python path:
   `recommendation_engine/venv/Scripts/python.exe`
4. Execute the cells (`Shift + Enter`).

### Method 2: Via Terminal Jupyter Server
Ensure your virtual environment is active (`.\venv\Scripts\Activate.ps1`), then run:
```powershell
jupyter notebook benchmarks/recommendation_scratchpad.ipynb
```

---

## 6. Mathematical Specifications Summary

1. **18-Feature Dataset Vector Mapping ($p=18$)**:
   Maps trail profile and user profile into a normalized 18-dimensional vector $[v_1 \dots v_{18}] \in [0, 1]^{18}$ covering 5 provinces, 5 mountain affinities, LASCO rating requirement, duration, length/elevation index, and 5 tourism infrastructures.

2. **Two-Anchor Profiles ($P_e$ and $P_d$)**:
   - $P_e$ (Easy Profile): Onboarding baseline prediction.
   - $P_d$ (Difficult Profile): Reverse-engineered upper intensity boundary prediction.

3. **Alpha Tuner Parameter ($\alpha$)**:
   $$\alpha = \begin{cases} 1 - \frac{u}{2m} & \text{if } u \le m \\ 1.0 & \text{if } u > m \end{cases}$$

4. **Recommendation Score Equation**:
   $$R_{tu} = \frac{\alpha (CB_{tu}) + (1 - \alpha) (CF_{tuv})}{\sqrt{18}}$$

5. **Profile Update Function & Beta Corrector Factor ($\beta$) Matrix**:
   $$P_{xu} = P_{xo} + \frac{1}{k} \sum_{i=1}^k \beta_i (H_{xi} - P_{xo})$$
   where $\beta_i = \frac{R_{tu}}{2}$ if matched (actual == predicted) else $-\frac{1 - R_{tu}}{2}$ if mismatched.
