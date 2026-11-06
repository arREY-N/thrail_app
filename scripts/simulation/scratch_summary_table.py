import json

with open('scripts/simulation/output/pillar_2_easy_bucket_twin_results.json', 'r') as f:
    d = json.load(f)

print('| Configuration | alpha=1.0000 (L / E / H) | alpha=0.7500 (L / E / H) | alpha=0.5612 (L / E / H) | alpha=0.5000 (L / E / H) |')
print('| :--- | :---: | :---: | :---: | :---: |')
for cfg, alphas in d.items():
    row = [cfg]
    for a in ['1.0000', '0.7500', '0.5612', '0.5000']:
        v = alphas[a]
        row.append(f"{v['med_lower']} / {v['med_equal']} / {v['med_higher']}")
    print(f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} |")
