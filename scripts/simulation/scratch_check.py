import os, sys, json
sys.path.insert(0, 'engine')
import firebase_client
firebase_client.initialize_firebase = lambda: None
from batch_runner import run_batch_recommendations
from tars import compute_alpha

trails = json.load(open('scripts/simulation/output/trails.json'))
users = json.load(open('engine/data/seeded_user_sets/set_1_users.json'))
t_by_id = {t['id']: t for t in trails}
alpha = compute_alpha(len(users))

res = run_batch_recommendations(cbf_engine='GD', cf_engine='GD', candidate_trails=trails, users=users, commit_to_firestore=False, generate_ai_reasoning=False, update_profiles_from_reviews=False, alpha_override=alpha)
recs = res['recommendations']

for u in users:
    is_vuln = (u.get('medical') == 'M') or bool(u.get('medicalProfile', {}).get('hasCondition')) or (u.get('stated_experience') == 'E1') or (u.get('actual_experience') == 'E1')
    if is_vuln:
        for item in recs[u['id']].get('easy', []):
            tf = t_by_id[item['id']]['profile']['features']
            ue = u['profile']['easy']['features']
            g_d = tf.get('gain', 0) - ue.get('gain', 0)
            s_d = tf.get('slope', 0) - ue.get('slope', 0)
            if g_d > 0.15 or s_d > 0.15:
                print(f"{u['cohort_group']} | {u['id']} | Exp: {u.get('stated_experience')} | Med: {u.get('medical')} | Trail: {item['trailName']} | g_diff: {g_d:.4f} | s_diff: {s_d:.4f}")

