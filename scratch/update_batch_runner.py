import os

path = 'engine/batch_runner.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """                raw_choice = r.get("perceivedDifficulty")
                if isinstance(raw_choice, (int, float)):
                    # 1: Easy, 2: Just Right, 3: Moderate, 4: Difficult/Hard, 5: Extreme
                    is_user_easy = (raw_choice <= 2)
                else:
                    choice_str = str(raw_choice or "easy").strip().lower()
                    is_user_easy = choice_str in ("easy", "just right", "1", "2")

                is_match = is_user_easy if (predicted_cat == "easy") else (not is_user_easy)"""

replacement1 = """                # Respect explicit is_match boolean if provided in review document
                if "is_match" in r:
                    is_match = bool(r["is_match"])
                elif "isMatch" in r:
                    is_match = bool(r["isMatch"])
                else:
                    raw_choice = r.get("perceivedDifficulty")
                    if isinstance(raw_choice, (int, float)):
                        # 1: Easy, 2: Just Right, 3: Moderate, 4: Difficult/Hard, 5: Extreme
                        is_user_easy = (raw_choice <= 2)
                        is_user_exhausting = (raw_choice >= 5)
                    else:
                        choice_str = str(raw_choice or "easy").strip().lower()
                        is_user_easy = choice_str in ("easy", "just right", "1", "2")
                        is_user_exhausting = choice_str in ("exhausting", "extreme", "too hard")

                    if predicted_cat == "easy":
                        is_match = is_user_easy
                    else:
                        # On difficult recommendation:
                        # "Easy" = Underwhelming Mismatch; "Exhausting" = Overexertion Mismatch; "Difficult" = Match
                        is_match = (not is_user_easy) and (not is_user_exhausting)"""

# Also ensure easy_items is never starved if manageable candidate trails exist in diff_items:
target2 = """        # Sort each list ascending by score (0.0 = closest match / highest recommendation)
        easy_items.sort(key=lambda x: x["score"])
        diff_items.sort(key=lambda x: x["score"])"""

replacement2 = """        # If easy_items is completely empty, admit the candidate with the lowest physical exertion
        # to ensure vulnerable/beginner cohorts always have a safe option to hike and review
        if not easy_items and diff_items:
            # Find candidate with minimal gain + slope exertion
            def trail_exertion(item):
                tid = str(item.get("id"))
                t_obj = trail_by_id.get(tid, {})
                t_phys = t_obj.get("profile", {}).get("features", t_obj.get("features", {}))
                return float(t_phys.get("slope", 0.0) or 0.0) + float(t_phys.get("gain", 0.0) or 0.0)
            safest_idx = min(range(len(diff_items)), key=lambda i: trail_exertion(diff_items[i]))
            safest_item = diff_items.pop(safest_idx)
            safest_item["category"] = "easy"
            safest_item["score"] = safest_item.get("easyScore", safest_item["score"])
            easy_items.append(safest_item)

        # Sort each list ascending by score (0.0 = closest match / highest recommendation)
        easy_items.sort(key=lambda x: x["score"])
        diff_items.sort(key=lambda x: x["score"])"""

assert target1 in text, "target1 not found"
assert target2 in text, "target2 not found"

text = text.replace(target1, replacement1, 1)
text = text.replace(target2, replacement2, 1)

with open(path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(text)

print("Successfully updated engine/batch_runner.py")

