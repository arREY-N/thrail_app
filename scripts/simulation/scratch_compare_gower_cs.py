import json

with open('scripts/simulation/output/trails.json', 'r') as f:
    trails_data = json.load(f)
trail_map = {t['id']: {'name': t['general']['name'], 'length': t['difficulty']['length'], 'gain': t['difficulty']['gain'], 'slope': t['difficulty']['slope'], 'lasco': t['difficulty']['lascoRating']} for t in trails_data}

with open('scripts/simulation/output/pillar_2_raw_recommendations.json', 'r') as f:
    recs_data = json.load(f)

gower_recs = recs_data['configurations']['Set 1: Pure Gower']['recommendations']
cs_recs = recs_data['configurations']['Set 3: Pure Cosine']['recommendations']

print('Comparing the 12 users who tied in Pure Gower (3.75 vs 3.75):')
for uid, u_g in gower_recs.items():
    g_el = sum(trail_map[t['id']]['lasco'] for t in u_g['easy']) / len(u_g['easy'])
    g_dl = sum(trail_map[t['id']]['lasco'] for t in u_g['difficult']) / len(u_g['difficult'])
    if g_el >= g_dl:
        u_c = cs_recs[uid]
        c_el = sum(trail_map[t['id']]['lasco'] for t in u_c['easy']) / len(u_c['easy'])
        c_dl = sum(trail_map[t['id']]['lasco'] for t in u_c['difficult']) / len(u_c['difficult'])
        easy_g_names = [trail_map[t['id']]['name'] for t in u_g['easy']]
        diff_g_names = [trail_map[t['id']]['name'] for t in u_g['difficult']]
        easy_c_names = [trail_map[t['id']]['name'] for t in u_c['easy']]
        diff_c_names = [trail_map[t['id']]['name'] for t in u_c['difficult']]
        print(f"User: {uid}")
        print(f"  GOWER:  Easy Lasco={g_el:.2f} (count={len(easy_g_names)}) | Diff Lasco={g_dl:.2f} (count={len(diff_g_names)})")
        print(f"          Easy: {easy_g_names}")
        print(f"          Diff: {diff_g_names}")
        print(f"  COSINE: Easy Lasco={c_el:.2f} (count={len(easy_c_names)}) | Diff Lasco={c_dl:.2f} (count={len(diff_c_names)})")
        print(f"          Easy: {easy_c_names}")
        print(f"          Diff: {diff_c_names}")
        print("-" * 60)

