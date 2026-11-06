with open('scripts/simulation/evaluate_pillar_2_constraints.py', 'r', encoding='utf-8') as f:
    code = f.read()

old_block = '''        # Safety Verdict & Physical Difficulty Alignment Score (Excluding Province)
        # Weights: 50% Baseline Physical Safety, 30% Medical Downshift, 20% Polar Separation (E4 - E1 Gain), -2 per normal violation
        polar_separation = max(0.0, e4_gain - e1_gain)
        if cbf == "CS":
            verdict = "DANGEROUS (Fail)"
            rank_score = 30.0 + (downshift_pct / 100.0) * 15.0 + polar_separation * 10.0
        elif cf == "CS":
            verdict = "MODERATE (Pass)"
            rank_score = 75.0 + (downshift_pct / 100.0) * 15.0 + polar_separation * 10.0
        elif norm_violations <= 2 and downshift_pct >= 20.0:
            verdict = "EXCELLENT (Pass)"
            rank_score = 80.0 + (downshift_pct / 100.0) * 10.0 + polar_separation * 10.0 - (norm_violations * 2.0)
        else:
            verdict = "GOOD (Pass)"
            rank_score = 70.0 + (downshift_pct / 100.0) * 15.0 + polar_separation * 10.0'''

# Let's inspect the exact lines in evaluate_pillar_2_constraints.py around rank_score
lines = code.splitlines()
target_idx = None
for i, l in enumerate(lines):
    if 'polar_separation = max(0.0, e4_gain - e1_gain)' in l:
        target_idx = i
        break

if target_idx is not None:
    print('Found at line', target_idx + 1)
    # Replace from target_idx to target_idx + 14
    new_lines = [
        '        # Purely Empirical Composite Alignment Score: 50% Medical Downshift + 50% Polar Gain Gap',
        '        # Relies strictly on physical measures (No arbitrary base scores)',
        '        polar_separation = max(0.0, e4_gain - e1_gain)',
        '        polar_separation_pct = polar_separation * 100.0',
        '        rank_score = (0.5 * downshift_pct) + (0.5 * polar_separation_pct)',
        '',
        '        if cbf == "CS":',
        '            verdict = "DANGEROUS (Fail)"',
        '        elif cf == "CS":',
        '            verdict = "MODERATE (Pass)"',
        '        elif downshift_pct >= 20.0 and polar_separation >= 0.15:',
        '            verdict = "EXCELLENT (Pass)"',
        '        else:',
        '            verdict = "GOOD (Pass)"'
    ]
    lines[target_idx:target_idx + 15] = new_lines
    with open('scripts/simulation/evaluate_pillar_2_constraints.py', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print('Successfully updated evaluate_pillar_2_constraints.py')
else:
    print('Target not found')

