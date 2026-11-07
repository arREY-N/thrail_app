import sys
sys.path.insert(0, 'engine')
import json
from profile_utils import extract_user_anchor_profiles, flatten_profile_features
from parameters import EXERTION_SAFETY_MARGIN_DEFAULT, EXERTION_SAFETY_MARGIN_VULNERABLE

users = json.load(open('scripts/simulation/aberrant_simulation/output/users.json'))
trails = json.load(open('scripts/simulation/aberrant_simulation/inputs/trails.json'))
u = next(x for x in users if x['id'] == 'AB-1-2-M-P1')
u_easy_vec, _, _, _ = extract_user_anchor_profiles(u)

user_med = bool(u.get('medicalProfile', {}).get('hasCondition', False))
user_exp = str(u.get('experience', 'E1')).strip()
is_vulnerable = user_med or (user_exp == 'E1')
margin = EXERTION_SAFETY_MARGIN_VULNERABLE if is_vulnerable else EXERTION_SAFETY_MARGIN_DEFAULT

print(f"User: {u['id']}, is_vulnerable={is_vulnerable}, margin={margin}")
for t in trails:
    tvec = flatten_profile_features(t.get('profile', t))
    exceeds = False
    reasons = []
    for phys_idx in (3, 4):
        diff = tvec[phys_idx] - u_easy_vec[phys_idx]
        if diff > margin:
            exceeds = True
            reasons.append(f"idx {phys_idx}: {diff:.3f} > {margin}")
    if not exceeds and (tvec[1] - u_easy_vec[1] > margin + 0.20):
        exceeds = True
        reasons.append(f"len: {tvec[1] - u_easy_vec[1]:.3f} > {margin+0.20}")
    print(f"{t['general']['name']:32s}: exceeds={exceeds} ({', '.join(reasons)})")

