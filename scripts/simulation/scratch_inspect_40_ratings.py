import json

with open("scripts/simulation/trail_simulation/inputs/catalog_seed42.json") as f:
    d = json.load(f)

trails = d["trails"]
ratings = {}
for t in trails:
    r = t.get("difficulty", {}).get("lascoRating")
    ratings[r] = ratings.get(r, 0) + 1

print("Lasco Rating Counts in 40-trail catalog (Seed 42):")
for r in sorted(ratings.keys()):
    print(f"  {r}/9: {ratings[r]} trails")

print("\nTrails <= 3/9 (Easy):")
for t in trails:
    if t.get("difficulty", {}).get("lascoRating") <= 3:
        print(f"  {t['id']} | {t.get('general', {}).get('name'):<30} | {t.get('difficulty', {}).get('lascoRating')}/9 | gain: {t.get('difficulty', {}).get('gain')}m")

print("\nTrails >= 6/9 (Hard / Extreme):")
for t in trails:
    if t.get("difficulty", {}).get("lascoRating") >= 6:
        print(f"  {t['id']} | {t.get('general', {}).get('name'):<30} | {t.get('difficulty', {}).get('lascoRating')}/9 | gain: {t.get('difficulty', {}).get('gain')}m")

