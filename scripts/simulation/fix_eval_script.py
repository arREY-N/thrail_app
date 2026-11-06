with open('scripts/simulation/evaluate_pillar_2_constraints.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '"cbf_formula": cbf,' in l:
        print('cbf_formula at line', i+1)
        lines.insert(i, '        telemetry["computed_alpha_benchmark"]["configurations"][name] = {\n')
        break

# Also clean up duplicate comments around line 227-228 if needed
clean_lines = []
for l in lines:
    if 'Weights: 50% Baseline Physical Safety' in l or 'Safety Verdict & Physical Difficulty Alignment Score' in l:
        continue
    clean_lines.append(l)

with open('scripts/simulation/evaluate_pillar_2_constraints.py', 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)
print('Fixed evaluate_pillar_2_constraints.py')

