import json

with open("scripts/simulation/output/mirrored_pillar_2_40trails_results.json") as f:
    d = json.load(f)

for cfg, alphas in d.items():
    print(f"\n{cfg}:")
    for a, data in alphas.items():
        print(f"  alpha={a}: exact6={data['hardest_exact6_count']}, ge6={data['hardest_ge6_count']}, Easy>3/9={data['easy_bucket_failed_count']}, EmptyEasy={data['empty_easy_count']}, Med<Healthy(all)={data['med_lower_all']}, Med<Healthy(easy)={data['med_lower_easy']}")

