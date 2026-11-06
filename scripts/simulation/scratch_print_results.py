import json

with open("scripts/simulation/output/mirrored_pillar_2_results.json", "r") as f:
    res = json.load(f)

for cfg, alphas in res.items():
    print(f"\n==========================================")
    print(f"{cfg}")
    print(f"==========================================")
    for a_val, data in alphas.items():
        print(f"  alpha = {a_val}:")
        print(f"    - Easy slot rule (<=3/9) broken: {data['rule1_broken']} of {data['total_vulnerable']} vulnerable cohorts")
        print(f"    - Difficult slot rule (no 6/9) broken: {data['rule2_broken']} of {data['total_vulnerable']} vulnerable cohorts")
        print(f"    - Medical pair downshift (<20%) failed: {data['rule3_failed']} of {data['total_pairs']} pairs (Mean downshift: {data['mean_downshift']*100:.1f}%)")
        print(f"    - Total vulnerable cohorts breaking any rule: {data['any_rule_broken_users']} of {data['total_vulnerable']}")
        if data['rule3_failed'] > 0:
            print(f"      Failed pairs: {[p[0] for p in data['rule3_failed_pairs']]}")

