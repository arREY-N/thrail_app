import json

with open('scripts/simulation/output/original_twin_set_easy_downshifts.json', 'r') as f:
    orig = json.load(f)

with open('scripts/simulation/output/sets_1_and_2_mirrored_evaluation_results.json', 'r') as f:
    mirr12 = json.load(f)

with open('scripts/simulation/output/set_3_mirrored_leh.json', 'r') as f:
    mirr3 = json.load(f)

alphas = ['1.0000', '0.7500', '0.5612', '0.5000']

for cfg in orig:
    print(f"### Configuration: {cfg}")
    print("| Dataset | a = 1.0000 (L / E / H) | a = 0.7500 (L / E / H) | a = 0.5612 (L / E / H) | a = 0.5000 (L / E / H) |")
    print("| :--- | :---: | :---: | :---: | :---: |")
    
    # Test
    row = ["Test"]
    for a in alphas:
        d = orig[cfg][a]
        row.append(f"{d['lower']} / {d['equal']} / {d['higher']}")
    print(f"| **{row[0]}** | {row[1]} | {row[2]} | {row[3]} | {row[4]} |")
    
    # Set 1
    row = ["Set 1"]
    for a in alphas:
        d = mirr12['Set 1'][cfg][a]
        row.append(f"{d['med_lower']} / {d['med_equal']} / {d['med_higher']}")
    print(f"| **{row[0]}** | {row[1]} | {row[2]} | {row[3]} | {row[4]} |")
    
    # Set 2
    row = ["Set 2"]
    for a in alphas:
        d = mirr12['Set 2'][cfg][a]
        row.append(f"{d['med_lower']} / {d['med_equal']} / {d['med_higher']}")
    print(f"| **{row[0]}** | {row[1]} | {row[2]} | {row[3]} | {row[4]} |")
    
    # Set 3
    row = ["Set 3"]
    for a in alphas:
        d = mirr3[cfg][a]
        row.append(f"{d['lower']} / {d['equal']} / {d['higher']}")
    print(f"| **{row[0]}** | {row[1]} | {row[2]} | {row[3]} | {row[4]} |")
    print()

