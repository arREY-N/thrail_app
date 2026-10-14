"""
@file run_visualizer.py
@description Launcher script for the official TARS 2.0 Interactive Testing & Sandbox Dashboard.
             Launches tars_interactive_dashboard.html directly in the user's web browser.
"""

import os
import sys
import webbrowser

VISUALIZER_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD_PATH = os.path.join(VISUALIZER_DIR, "tars_interactive_dashboard.html")

def launch_dashboard():
    if not os.path.exists(DASHBOARD_PATH):
        print(f"[Error] Could not locate dashboard file at {DASHBOARD_PATH}")
        sys.exit(1)

    print("==========================================================================================")
    print("  TARS 2.0 INTERACTIVE TESTING DASHBOARD LAUNCHER ")
    print("==========================================================================================")
    print(f"Launching dashboard: {DASHBOARD_PATH}")
    
    webbrowser.open(f"file:///{DASHBOARD_PATH}")
    print("Dashboard successfully launched in default web browser!")

if __name__ == "__main__":
    launch_dashboard()
