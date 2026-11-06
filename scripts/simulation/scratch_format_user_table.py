import json

with open('scripts/simulation/output/original_twin_set_easy_downshifts.json', 'r') as f:
    orig = json.load(f)

with open('scripts/simulation/output/sets_1_and_2_mirrored_evaluation_results.json', 'r') as f:
    mirr = json.load(f)

alphas = ['1.0000', '0.7500', '0.5612', '0.5000']

for cfg in orig:
    print(f"#### {cfg}")
    print("| Dataset | a = 1.0000 (L / E / H) | a = 0.7500 (L / E / H) | a = 0.5612 (L / E / H) | a = 0.5000 (L / E / H) |")
    print("| :--- | :---: | :---: | :---: | :---: |")
    
    # Test row
    row_test = ["Test (Original)"]
    for a in alphas:
        d = orig[cfg][a]
        row_test.append(f"{d['lower']} / {d['equal']} / {d['higher']}")
    print(f"| {row_test[0]} | {row_test[1]} | {row_test[2]} | {row_test[3]} | {row_test[4]} |")
    
    # Set 1 row
    row_s1 = ["Set 1 (Mirrored)"]
    for a in alphas:
        d = mirr['Set 1'][cfg][a]
        row_s1.append(f"{d['med_lower']} / {d['med_equal']} / {d['med_higher']}")
    print(f"| {row_s1[0]} | {row_s1[1]} | {row_s1[2]} | {row_s1[3]} | {row_s1[4]} |")
    
    # Set 2 row
    row_s2 = ["Set 2 (Mirrored)"]
    for a in alphas:
        d = mirr['Set 2'][cfg][a]
        row_s2.append(f"{d['med_lower']} / {d['med_equal']} / {d['med_higher']}")
    print(f"| {row_s2[0]} | {row_s2[1]} | {row_s2[2]} | {row_s2[3]} | {row_s2[4]} |")
    print()

