import json
import numpy as np

with open("scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json") as f:
    raw = json.load(f)
with open("scripts/simulation/output/trails.json") as f:
    trails = {t["id"]: t for t in json.load(f)}
with open("engine/data/seeded_user_sets/set_1_users_mirrored.json") as f:
    users = json.load(f)

pairs = {}
for u in users:
    tid = u["twin_pair_id"]
    if tid not in pairs:
        pairs[tid] = {
            "archetype": u.get("base_cohort_code", ""),
            "stated_exp": u.get("stated_experience", ""),
            "actual_exp": u.get("actual_experience", "")
        }
    if u["medical"] == "N":
        pairs[tid]["h"] = u["id"]
    else:
        pairs[tid]["m"] = u["id"]

c1 = raw["configurations"]["Set 1: Pure Gower"]["0.5612"]
for pid in sorted(pairs.keys()):
    h_rec = c1[pairs[pid]["h"]]
    m_rec = c1[pairs[pid]["m"]]
    h_ez = h_rec.get("easy", [])
    m_ez = m_rec.get("easy", [])
    h_gain = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in h_ez])
    m_gain = np.mean([trails[x["id"]]["difficulty"]["gain"] for x in m_ez])
    pct = ((m_gain - h_gain) / h_gain) * 100
    status = "Lower (Downshifted)" if m_gain < h_gain else ("Equal (Clamped)" if m_gain == h_gain else "Higher")
    h_t = [x["trailName"] for x in h_ez]
    m_t = [x["trailName"] for x in m_ez]
    print(f"{pid:<8} | {pairs[pid]['archetype']:<10} | {pairs[pid]['stated_exp']} (act:{pairs[pid]['actual_exp']}) | H: {h_gain:5.1f}m | M: {m_gain:5.1f}m | {pct:+6.1f}% | {status:<18} | H_trails: {h_t} -> M_trails: {m_t}")

