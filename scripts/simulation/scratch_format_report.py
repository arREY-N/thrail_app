import json

with open("scripts/simulation/output/mirrored_pillar_2_results.json", "r") as f:
    res = json.load(f)

for cfg, alphas in res.items():
    print(f"\n### {cfg}")
    for a_val in ["1.0", "0.75", "0.5612244898", "0.5"]:
        data = alphas[a_val]
        a_float = float(a_val)
        print(f"\n#### alpha = {a_float:.4f}")
        print(f"- **Easy Slots (Top 3) Rule (<= 3/9):** {data['rule1_broken']} of {data['total_vulnerable']} vulnerable cohorts broke this rule")
        print(f"- **Difficult Slots (Top 2) Rule (No 6/9):** {data['rule2_broken']} of {data['total_vulnerable']} vulnerable cohorts broke this rule")
        print(f"- **Medical vs. Healthy Twin Downshift (>= 20% lower gain):** {data['rule3_failed']} of {data['total_pairs']} pairs failed (Mean downshift: {data['mean_downshift']*100:.1f}%)")
        print(f"- **Total Cohorts Violating Any Safety Rule:** {data['any_rule_broken_users']} of {data['total_vulnerable']} cohorts")

