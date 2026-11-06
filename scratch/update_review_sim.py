path = 'scripts/simulation/aberrant_simulation/scripts/run_aberrant_simulation.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """        # Check if trail physically overpowers even their difficult limit (e.g. novice claiming expert)
        severe_overpowers = []
        for k in ["gain", "slope", "elevation", "length"]:
            diff = trail_feats[k] - diff_gt_feats[k]
            if diff > 0.10:
                severe_overpowers.append((k, diff))

        if severe_overpowers:
            # Severe overexertion mismatch: trail far exceeded even aspirational GT limit!
            perceived_difficulty = "Exhausting"
            severe_overpowers.sort(key=lambda x: x[1], reverse=True)
            primary_key = severe_overpowers[0][0]
            for k, _ in severe_overpowers:
                selected_phrases.append(phrase_map[k])
        elif phys_dist_easy + 0.15 < phys_dist_diff:
            # Underwhelming mismatch: trail lacked desired challenge
            perceived_difficulty = "Easy"
            diffs = [(k, diff_gt_feats[k] - trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1], reverse=True)
            primary_key = diffs[0][0]
            selected_phrases.append(phrase_map[primary_key])
        else:
            # Appropriate challenge (Match)
            perceived_difficulty = "Difficult"
            chal = [(k, trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            chal.sort(key=lambda x: x[1], reverse=True)
            primary_key = chal[0][0]
            for k, _ in chal[:2]:
                selected_phrases.append(phrase_map[k])"""

replacement = """        # Check if trail physically overpowers even their difficult limit (e.g. novice claiming expert)
        mean_diff = float(np.mean([trail_feats[k] - diff_gt_feats[k] for k in ["length", "gain", "slope", "elevation"]]))
        count_over = sum(1 for k in ["gain", "slope", "elevation", "length"] if trail_feats[k] - diff_gt_feats[k] > 0.15)

        if mean_diff > 0.08 or count_over >= 2:
            # Severe overexertion mismatch: trail far exceeded even aspirational GT limit!
            perceived_difficulty = "Exhausting"
            severe_overpowers = [(k, trail_feats[k] - diff_gt_feats[k]) for k in ["length", "gain", "slope", "elevation"] if trail_feats[k] - diff_gt_feats[k] > 0.0]
            severe_overpowers.sort(key=lambda x: x[1], reverse=True)
            primary_key = severe_overpowers[0][0] if severe_overpowers else "slope"
            for k, _ in severe_overpowers:
                selected_phrases.append(phrase_map[k])
        elif phys_dist_easy + 0.12 < phys_dist_diff or mean_diff < -0.20:
            # Underwhelming mismatch: trail lacked desired challenge
            perceived_difficulty = "Easy"
            diffs = [(k, diff_gt_feats[k] - trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            diffs.sort(key=lambda x: x[1], reverse=True)
            primary_key = diffs[0][0]
            selected_phrases.append(phrase_map[primary_key])
        else:
            # Appropriate challenge (Match)
            perceived_difficulty = "Difficult"
            chal = [(k, trail_feats[k]) for k in ["length", "gain", "slope", "elevation"]]
            chal.sort(key=lambda x: x[1], reverse=True)
            primary_key = chal[0][0]
            for k, _ in chal[:2]:
                selected_phrases.append(phrase_map[k])"""

assert target in text, "target not found"
text = text.replace(target, replacement, 1)

with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Updated review logic successfully.")

