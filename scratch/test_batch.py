import sys
sys.path.insert(0, 'engine')
import json
import firebase_client
firebase_client.initialize_firebase = lambda: None
from batch_runner import *

users = json.load(open('scripts/simulation/aberrant_simulation/output/users.json'))
trails = json.load(open('scripts/simulation/aberrant_simulation/inputs/trails.json'))
u = next(x for x in users if x['id'] == 'AB-1-2-M-P1')

u_easy_vec, u_diff_vec, _, _ = extract_user_anchor_profiles(u)
cf_peer_pool = users
peer_easy_vectors = [extract_user_anchor_profiles(x)[0] for x in cf_peer_pool]
peer_diff_vectors = [extract_user_anchor_profiles(x)[1] for x in cf_peer_pool]
other_easy_peers = [p for i, p in enumerate(peer_easy_vectors) if cf_peer_pool[i]['id'] != u['id']]
other_diff_peers = [p for i, p in enumerate(peer_diff_vectors) if cf_peer_pool[i]['id'] != u['id']]
alpha = compute_alpha(len(users))
weight_vector = build_feature_weight_vector()

t = next(x for x in trails if 'Batulao' in x['general']['name'] and 'New' not in x['general']['name'])
tvec = flatten_profile_features(t.get('profile', t))

res_easy = engine_details(cbf_engine='GD', cf_engine='GD', array_1=u_easy_vec, array_2=tvec, a=alpha, peer_profiles=other_easy_peers, weights=weight_vector)
res_diff = engine_details(cbf_engine='GD', cf_engine='GD', array_1=u_diff_vec, array_2=tvec, a=alpha, peer_profiles=other_diff_peers, weights=weight_vector)

easy_score = round(float(res_easy["score"]), 4)
diff_score = round(float(res_diff["score"]), 4)
print(f"Mt. Batulao: easy_score={easy_score}, diff_score={diff_score}, easy<=diff: {easy_score <= diff_score}")
