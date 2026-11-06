import json

with open('scripts/simulation/output/sets_1_2_3_monotonicity_results.json', 'r') as f:
    d = json.load(f)

print(f"{'Configuration':<25} | {'Set 1 (44)':<12} | {'Set 2 (44)':<12} | {'Set 3 (44)':<12} | {'Total (132)':<15}")
print("-" * 85)
for cfg in d['Set 1']['configurations']:
    s1 = d['Set 1']['configurations'][cfg]['summary']['all3_pass']
    s2 = d['Set 2']['configurations'][cfg]['summary']['all3_pass']
    s3 = d['Set 3']['configurations'][cfg]['summary']['all3_pass']
    comb = s1 + s2 + s3
    print(f"{cfg:<25} | {s1:>2}/44 ({s1/44*100:5.1f}%) | {s2:>2}/44 ({s2/44*100:5.1f}%) | {s3:>2}/44 ({s3/44*100:5.1f}%) | {comb:>3}/132 ({comb/132*100:5.1f}%)")

