import json

d = json.load(open('scripts/simulation/output/test_set1_set2_set3_monotonicity.json'))

for cfg in d['Test (Original)']:
    print(f"### {cfg}")
    print("| Dataset | Elevation Gain (<) | Slope Gradient (<) | Trail Length (<) | Strict Physical Monotonicity (All 3 Lower) |")
    print("| :--- | :---: | :---: | :---: | :---: |")
    for dset in ['Test (Original)', 'Set 1 (Mirrored)', 'Set 2 (Mirrored)', 'Set 3 (Mirrored)']:
        v = d[dset][cfg]
        tot = v['total']
        g = v['gain']
        s = v['slope']
        l = v['len']
        a = v['all3']
        d_name = dset.split()[0] # Test, Set 1, Set 2, Set 3
        if "Original" in dset: d_name = "Test"
        elif "1" in dset: d_name = "Set 1"
        elif "2" in dset: d_name = "Set 2"
        elif "3" in dset: d_name = "Set 3"
        print(f"| **{d_name}** | {g} of {tot} ({g/tot*100:.1f}%) | {s} of {tot} ({s/tot*100:.1f}%) | {l} of {tot} ({l/tot*100:.1f}%) | **{a} of {tot} ({a/tot*100:.1f}%)** |")
    print()

