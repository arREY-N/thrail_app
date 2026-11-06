import json

with open("scripts/simulation/output/mirrored_pillar_2_40trails_results.json") as f:
    d = json.load(f)

alphas = ['1.0000', '0.7500', '0.5612', '0.5000']

for cfg in d:
    print(f"\n{cfg}")
    for a in alphas:
        r = d[cfg][a]
        print(f"  alpha={a}: Top5 Med<Healthy: {r['med_lower_top5']}/22 | Easy Med<Healthy: {r['med_lower_easy']}/22 | All Med<Healthy: {r['med_lower_all']}/22")

