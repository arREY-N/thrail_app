import json

with open("scripts/simulation/output/mirrored_pillar_2_40trails_raw_recs.json") as f:
    d = json.load(f)

with open("scripts/simulation/trail_simulation/inputs/catalog_seed42.json") as f:
    trails = {t["id"]: t for t in json.load(f)["trails"]}

c1 = d["configurations"]["Set 1: Pure Gower"]["1.0000"]
u1 = c1["cohort01_healthy"]

print(f"cohort01_healthy easy count: {len(u1.get('easy', []))}")
print(f"cohort01_healthy diff count: {len(u1.get('difficult', []))}")
print("Easy bucket trails:")
for x in u1.get('easy', []):
    t = trails[x["id"]]
    print(f"  {x['id']} | {x['trailName']} | {t['difficulty']['lascoRating']}/9 | gain: {t['difficulty']['gain']}m | score: {x['score']}")

