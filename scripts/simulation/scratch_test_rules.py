import json

with open("scripts/simulation/output/mirrored_pillar_2_raw_recommendations.json") as f:
    raw = json.load(f)

with open("scripts/simulation/output/trails.json") as f:
    trails = {t["id"]: t for t in json.load(f)}

with open("engine/data/seeded_user_sets/set_1_users_mirrored.json") as f:
    users = json.load(f)

user_map = {u["id"]: u for u in users}

# Identify 31 protected users (beginner: actual E1 or stated E1, and medical: M)
def is_protected(u):
    is_med = bool(u.get("medicalProfile", {}).get("hasCondition", False)) or u.get("medical") == "M"
    is_beg = u.get("actual_experience") == "E1" or u.get("stated_experience") == "E1"
    return is_beg or is_med

protected_uids = [u["id"] for u in users if is_protected(u)]
print(f"Total protected users: {len(protected_uids)}")

# Let's inspect Set 1 @ 1.0000
cfg_data = raw["configurations"]["Set 1: Pure Gower"]["1.0000"]

print("\n--- Inspecting Easy Buckets across all 44 users in Set 1 (1.0000) ---")
empty_easy = 0
easy_has_above_3 = 0
for uid in protected_uids:
    u_recs = cfg_data[uid]
    easy_b = u_recs.get("easy", [])
    diff_b = u_recs.get("difficult", [])
    
    # check empty
    if len(easy_b) == 0:
        empty_easy += 1
    
    # check if any in easy is > 3/9
    has_above_3 = any(trails[t["id"]]["difficulty"]["lascoRating"] > 3 for t in easy_b)
    if has_above_3:
        easy_has_above_3 += 1

print(f"Protected users with empty Easy bucket: {empty_easy}")
print(f"Protected users with Easy bucket containing > 3/9: {easy_has_above_3}")

# Check 6/9 trail in either bucket
# 6/9 trail id is 7aTSWWzmcnhS1Q4nfCog (Mt. Makiling Traverse)
mak_id = "7aTSWWzmcnhS1Q4nfCog"

# In Top-5 dual anchor (Top 3 Easy + Top 2 Diff):
mak_in_top5 = 0
# In Entire buckets returned:
mak_in_any_bucket = 0
for uid in protected_uids:
    u_recs = cfg_data[uid]
    easy_b = u_recs.get("easy", [])
    diff_b = u_recs.get("difficult", [])
    
    # Top 5 dual anchor
    top5 = easy_b[:3] + diff_b[:max(0, 5 - len(easy_b[:3]))]
    if len(top5) < 5:
        top5 += [x for x in diff_b if x not in top5][:5 - len(top5)]
    top5_ids = [x["id"] for x in top5]
    if mak_id in top5_ids:
        mak_in_top5 += 1
        
    all_returned_ids = [x["id"] for x in easy_b] + [x["id"] for x in diff_b]
    if mak_id in all_returned_ids:
        mak_in_any_bucket += 1

print(f"Protected users receiving 6/9 in Top-5 recommendation: {mak_in_top5}")
print(f"Protected users having 6/9 anywhere in returned buckets: {mak_in_any_bucket}")

