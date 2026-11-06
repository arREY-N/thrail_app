import json
import numpy as np

trails = json.load(open('scripts/simulation/aberrant_simulation/inputs/trails.json'))
users = json.load(open('scripts/simulation/aberrant_simulation/output/users.json'))

for uid in ['AB-4-1-N-P1', 'AB-1-4-N-P1']:
    u = next(x for x in users if x['id'] == uid)
    gt_diff = u['groundTruth']['difficult']
    gt_easy = u['groundTruth']['easy']
    print(f"\n=== User: {uid} (Stated E{u['stated_tier']} -> Actual E{u['actual_tier']}) ===")
    for t in trails:
        tf = t.get('profile', t).get('features', {})
        tname = t['general']['name']
        mean_diff = float(np.mean([tf[k] - gt_diff[k] for k in ["length", "gain", "slope", "elevation"]]))
        count_over = sum(1 for k in ["gain", "slope", "elevation", "length"] if tf[k] - gt_diff[k] > 0.15)
        
        phys_dist_easy = float(np.mean([abs(tf[k] - gt_easy[k]) for k in ["length", "gain", "slope", "elevation"]]))
        phys_dist_diff = float(np.mean([abs(tf[k] - gt_diff[k]) for k in ["length", "gain", "slope", "elevation"]]))
        
        if mean_diff > 0.08 or count_over >= 2:
            res = "Exhausting (Overexertion)"
        elif phys_dist_easy + 0.12 < phys_dist_diff or mean_diff < -0.20:
            res = "Easy (Underwhelming)"
        else:
            res = "Difficult (Appropriate Challenge)"
        print(f"  {tname:32s}: {res}")

