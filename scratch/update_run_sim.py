path = 'scripts/simulation/aberrant_simulation/scripts/run_aberrant_simulation.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """        for k in ["length", "gain", "slope", "elevation"]:
            diff = trail_feats[k] - easy_gt_feats[k]
            if diff > 0.06:
                excesses.append((k, diff))"""

replacement1 = """        for k in ["length", "gain", "slope", "elevation"]:
            diff = trail_feats[k] - easy_gt_feats[k]
            if diff > 0.15:
                excesses.append((k, diff))"""

target2 = """    return {
        "id": f"rev_{trail_doc['id']}_{active_month}",
        "trail": {"id": trail_doc["id"], "name": tname},
        "trailId": trail_doc["id"],
        "trailName": tname,
        "perceivedDifficulty": "Difficult" if perceived_difficulty == "Exhausting" else perceived_difficulty,
        "raw_experience": perceived_difficulty,
        "is_match": is_match,"""

replacement2 = """    return {
        "id": f"rev_{trail_doc['id']}_{active_month}",
        "trail": {"id": trail_doc["id"], "name": tname},
        "trailId": trail_doc["id"],
        "trailName": tname,
        "perceivedDifficulty": perceived_difficulty,
        "raw_experience": perceived_difficulty,
        "is_match": is_match,"""

assert target1 in text, "target1 not found"
assert target2 in text, "target2 not found"

text = text.replace(target1, replacement1, 1)
text = text.replace(target2, replacement2, 1)

with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Successfully updated run_aberrant_simulation.py")

