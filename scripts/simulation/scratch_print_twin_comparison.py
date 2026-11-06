import json

with open('scripts/simulation/output/original_twin_set_easy_downshifts.json', 'r') as f:
    orig = json.load(f)

with open('scripts/simulation/output/sets_1_and_2_mirrored_evaluation_results.json', 'r') as f:
    mirr = json.load(f)

print("### AT DYNAMIC ALPHA (alpha = 0.5612)")
print(f"{'Configuration':<25} | {'Original Twin Set':<20} | {'Mirrored Set 1':<20} | {'Mirrored Set 2':<20}")
print("-" * 92)
for cfg in orig:
    o = orig[cfg]['0.5612']
    m1 = mirr['Set 1'][cfg]['0.5612']
    m2 = mirr['Set 2'][cfg]['0.5612']
    o_str = f"{o['lower']}L / {o['equal']}E / {o['higher']}H"
    m1_str = f"{m1['med_lower']}L / {m1['med_equal']}E / {m1['med_higher']}H"
    m2_str = f"{m2['med_lower']}L / {m2['med_equal']}E / {m2['med_higher']}H"
    print(f"{cfg:<25} | {o_str:<20} | {m1_str:<20} | {m2_str:<20}")

print("\n### MULTI-ALPHA COMPARISON FOR PURE GOWER (Set 1: Pure Gower)")
print(f"{'Alpha Level':<15} | {'Original Twin Set':<20} | {'Mirrored Set 1':<20} | {'Mirrored Set 2':<20}")
print("-" * 82)
for a in ['1.0000', '0.7500', '0.5612', '0.5000']:
    o = orig['Set 1: Pure Gower'][a]
    m1 = mirr['Set 1']['Set 1: Pure Gower'][a]
    m2 = mirr['Set 2']['Set 1: Pure Gower'][a]
    o_str = f"{o['lower']}L / {o['equal']}E / {o['higher']}H"
    m1_str = f"{m1['med_lower']}L / {m1['med_equal']}E / {m1['med_higher']}H"
    m2_str = f"{m2['med_lower']}L / {m2['med_equal']}E / {m2['med_higher']}H"
    print(f"alpha = {a:<7} | {o_str:<20} | {m1_str:<20} | {m2_str:<20}")

