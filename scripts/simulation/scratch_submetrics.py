import json

with open("scripts/simulation/output/pillar_1_variety_results.json") as f:
    data = json.load(f)

sc = data["results_by_scenario"]["actual_dynamic_alpha"]["configurations"]
for k, v in sc.items():
    print(f"{k:<20} | Top-3: {v['top3_mean_variety']:.4f} | Polar: {v['polar_e1_vs_e4_variety']:.4f} | Med: {v['cross_medical_variety']:.4f}")

