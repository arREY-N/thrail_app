import json

with open("scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json") as f:
    d = json.load(f)

c1 = d["configurations"]["Set 1: Pure Gower"]["1.0000"]
u1 = c1["cohort01_healthy"]

print(f"cohort01_healthy easy count: {len(u1.get('easy', []))}")
print(f"cohort01_healthy diff count: {len(u1.get('difficult', []))}")
for x in u1.get('easy', []):
    print("  Easy:", x["trailName"])
for x in u1.get('difficult', []):
    print("  Diff:", x["trailName"])

