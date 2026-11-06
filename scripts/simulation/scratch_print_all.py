import json

with open("scripts/simulation/output/mirrored_pillar_2_results.json") as f:
    d = json.load(f)

for name in ['Set 4: GD / ED', 'Set 5: GD / CS', 'Set 6: ED / GD']:
    print(name)
    for a in ['1.0', '0.75', '0.5612244898', '0.5']:
        r = d[name][a]
        print(f"  a={float(a):.4f} | R1(easy>3): {r['rule1_broken']} | R2(diff=6): {r['rule2_broken']} | R3(downshift<20%): {r['rule3_failed']} | Any: {r['any_rule_broken_users']}")

