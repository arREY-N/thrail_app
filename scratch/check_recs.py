import sys
sys.path.insert(0, 'engine')
import json
from batch_runner import *
from tars import compute_alpha

users = json.load(open('scripts/simulation/aberrant_simulation/output/users.json'))
trails = json.load(open('scripts/simulation/aberrant_simulation/inputs/trails.json'))
u = next(x for x in users if x['id'] == 'AB-1-2-M-P1')
u_easy_vec, u_diff_vec, _, _ = extract_user_anchor_profiles(u)
other_easy = [extract_user_anchor_profiles(x)[0] for x in users if x['id'] != u['id']]
other_diff = [extract_user_anchor_profiles(x)[1] for x in users if x['id'] != u['id']]
alpha = compute_alpha(len(users))

print(f"Alpha: {alpha:.4f}")
for t in trails:
    tvec = flatten_profile_features(t.get('profile', t))
    re = engine_details(cbf_engine='GD', cf_engine='GD', array_1=u_easy_vec, array_2=tvec, a=alpha, peer_profiles=other_easy)
    rd = engine_details(cbf_engine='GD', cf_engine='GD', array_1=u_diff_vec, array_2=tvec, a=alpha, peer_profiles=other_diff)
    print(f"{t['general']['name']:32s}: easy={re['score']:.4f} (cbf={re['cbf']:.4f}, cf={re['cf']:.4f}) | diff={rd['score']:.4f} (cbf={rd['cbf']:.4f}, cf={rd['cf']:.4f})")

