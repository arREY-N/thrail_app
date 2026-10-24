# Agent Prompt: Workstation Hardening & Node 22 Runtime Verification

> **How to use this prompt:**
> Copy and paste the entire block below into your AI coding assistant (Antigravity, Cursor, Claude, Copilot, etc.) inside this repository. The agent will act as a Senior DevOps and AppSec engineer, inspecting your local machine and guiding you step-by-step through local workstation hardening.

---

```markdown
Act as a senior DevOps and application security engineer. The repository has recently been upgraded to Node 22 LTS on the `main` branch to address the Node2Shell vulnerability (CVE-2026-111497) and eliminate backend serverless risks.

All repository configuration files (`functions/package.json`, `firebase.json`, and lockfiles) have already been committed to `main`. Your task is to audit and harden ONLY my local workstation and development environment to match these updates. Do NOT modify the committed repository architecture unless an environment mismatch is detected.

Please walk me through the following verification and remediation steps systematically, asking for terminal outputs one step at a time:

### Step 1: Git Branch & Upstream Sync
- Verify that I have pulled the latest `main` branch:
  `git status` and `git log -n 1 --oneline`
- Ensure no dirty uncommitted files conflict with `functions/package.json` or `firebase.json`.

### Step 2: Local Node.js Runtime & NVM Security Audit (CVE-2026-111497)
- Check my active local Node runtime:
  - If it is `< 22.23.4`, `< 24.22.1`, `< 26.12.1`, or any `20.x` or older, it is vulnerable to CVE-2026-111497 and will trigger `EBADENGINE` warnings.
- Guide me through installing and activating the patched Node 22 LTS release using NVM:
  - Windows: `nvm install 22.23.4; nvm use 22.23.4`
  - macOS/Linux: `nvm install 22.23.4 && nvm use 22.23.4 && nvm alias default 22.23.4`
- Recommend removing obsolete, vulnerable Node 20.x runtimes (`nvm list`, `nvm uninstall <version>`).
- Check system PATH for duplicate or shadowed Node binaries (`Get-Command node -All` on Windows or `which -a node` on macOS/Linux).

### Step 3: Local Dependency Hydration & Clean Install
- Ensure I do NOT run `npm audit fix --force` on the root Expo workspace (to prevent breaking React Native/Expo dependencies).
- Guide me through clean cache verification and dependency reconstitution using committed lockfile hashes:
  1. `npm cache verify`
  2. `npm ci` (in root)
  3. `cd functions && npm ci && cd ..`
- Run a production audit on backend functions to confirm zero vulnerabilities:
  `cd functions && npm audit --omit=dev && cd ..`

### Step 4: Local Function Syntax & Runtime Validation
- Test that `functions/index.js` loads cleanly under the local Node 22 runtime without CommonJS / ES Module (`ERR_REQUIRE_ESM`) collisions:
  `node -e "require('./functions/index.js'); console.log('Functions loaded successfully!')"`
- Run `npm --prefix functions run lint` to ensure code style compliance.

### Step 5: Firebase CLI & Multi-Developer Deployment Protocol
- Verify my Firebase CLI installation: `firebase --version` (ensure it is >= 13.x/14.x).
- Enforce the multi-developer safety rule:
  - When running `firebase deploy --only functions`, if prompted:
    `? Would you like to proceed with deletion? Selecting no will continue the rest of the deployments. (y/N)`
    I must ALWAYS answer `N` so that teammates' cloud functions are never deleted.
  - Advise on targeted deployments (`firebase deploy --only functions:<functionName>`) to prevent deletion prompts altogether.

Ask me for my terminal output starting with Step 1, and evaluate the results before moving to the next step.
```
