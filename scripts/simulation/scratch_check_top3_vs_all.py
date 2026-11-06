import json

with open("scripts/simulation/output/mirrored_pillar_2_40trails_raw_recs.json") as f:
    d = json.load(f)

with open("scripts/simulation/trail_simulation/inputs/catalog_seed42.json") as f:
    trails = {t["id"]: t for t in json.load(f)["trails"]}

with open("engine/data/seeded_user_sets/set_1_users_mirrored.json") as f:
    users = json.load(f)

def is_protected(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

protected_uids = [u["id"] for u in users if is_protected(u)]

c1 = d["configurations"]["Set 1: Pure Gower"]["1.0000"]

top3_bad = 0
all_bad = 0

for uid in protected_uids:
    ez = c1[uid].get("easy", [])
    if any(trails[x["id"]]["difficulty"]["lascoRating"] > 3 for x in ez[:3]):
        top3_bad += 1
    if any(trails[x["id"]]["difficulty"]["lascoRating"] > 3 for x in ez):
        all_bad += 1

print(f"Top 3 Easy slots broken (>3/9): {top3_bad} of {len(protected_uids)}")
print(f"Entire Easy bucket contains (>3/9): {all_bad} of {len(protected_uids)}")

