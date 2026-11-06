import json

with open("scripts/simulation/trail_simulation/inputs/catalog_seed42.json") as f:
    d = json.load(f)

print(f"Total trails: {len(d['trails'])}")
for t in d['trails']:
    r = t.get('difficulty', {}).get('lascoRating')
    if r == 6:
        print(f"{t['id']} | {t.get('general', {}).get('name'):<30} | lasco: {r}/9 | gain: {t.get('difficulty', {}).get('gain')}m | synthetic: {t.get('synthetic')}")

