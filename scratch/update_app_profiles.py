import json
import copy

path = 'scripts/simulation/aberrant_simulation/inputs/app_profiles.json'
with open(path, 'r', encoding='utf-8') as f:
    users = json.load(f)

for u in users:
    if u['id'].startswith('E1'):
        is_med = bool(u.get('medicalProfile', {}).get('hasCondition', False))
        scale = 0.80 if is_med else 1.00
        easy_v = 0.12 * scale
        diff_v = 0.35 * scale
        
        # Physical features
        for k in ['length', 'elevation', 'gain', 'slope', 'easy']:
            u['profile']['easy']['features'][k] = round(easy_v, 4)
            u['profile']['difficult']['features'][k] = round(diff_v, 4)
        for t in ['muddy', 'rocky', 'grassland', 'ridges']:
            u['profile']['easy']['features']['terrain'][t] = round(easy_v, 4)
            u['profile']['difficult']['features']['terrain'][t] = round(diff_v, 4)

with open(path, 'w', encoding='utf-8') as f:
    json.dump(users, f, indent=2)

print("Updated E1 intake profiles in app_profiles.json to realistic beginner values (0.12 / 0.35)")

