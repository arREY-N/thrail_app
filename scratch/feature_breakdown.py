import sys
sys.path.insert(0, 'engine')
import json
from parameters import CANONICAL_FEATURES
from profile_utils import extract_user_anchor_profiles, flatten_profile_features, build_feature_weight_vector

users = json.load(open('scripts/simulation/aberrant_simulation/output/users.json'))
trails = json.load(open('scripts/simulation/aberrant_simulation/inputs/trails.json'))
u = next(x for x in users if x['id'] == 'AB-1-2-M-P1')
t = next(x for x in trails if 'Batulao' in x['general']['name'] and 'New' not in x['general']['name'])

easy_vec, diff_vec, _, _ = extract_user_anchor_profiles(u)
tvec = flatten_profile_features(t.get('profile', t))
weights = build_feature_weight_vector()

print(f"{'Feature':20s} {'Weight':8s} {'Trail':8s} {'Easy':8s} {'Diff':8s} {'|T-Easy|':8s} {'|T-Diff|':8s}")
for i, f in enumerate(CANONICAL_FEATURES):
    w = weights[i]
    tv = tvec[i]
    ev = easy_vec[i]
    dv = diff_vec[i]
    de = abs(tv - ev)
    dd = abs(tv - dv)
    if de != dd:
        print(f"{f['key']:20s} {w:<8.2f} {tv:<8.4f} {ev:<8.4f} {dv:<8.4f} {de:<8.4f} {dd:<8.4f}")

