### AEO Evaluation Prompt Chain

Files:
- `CHAIN.md` — chain overview and orchestration contract
- `schemas.json` — JSON schemas for inputs/outputs (now aligned to Google & Perplexity)
- `01_intake.md` — normalize inputs → `NormalizedIntake`
- `02_context_priming.md` — distill `AEO Context` → `AEOHeuristics`
- `03_scoring.md` — score with rationale → `AEOScore`
- `04_recommendations.md` — prioritized edits → `Recommendations`

Usage outline (pseudo):
1. Load `/Users/kjyoo/Perpex/AEO Context` as string `AEO_CONTEXT_TEXT`.
2. Provide `GoogleSearchInput` (e.g., `google-result.json`), `PerplexityInput` (e.g., `perplexity-result.json`), and optional `ContentInput` to 01.
3. Feed 02 with `AEO_CONTEXT_TEXT` to get `AEOHeuristics`.
4. Feed 03 with `NormalizedIntake` + `AEOHeuristics` → `AEOScore`.
5. Feed 04 with `NormalizedIntake` + `AEOScore` → `Recommendations`.
6. (Optional) Run Competitor Page Audit using `PageAudit` on selected Google `results[n].url`.

Notes:
- Enforce schema compliance strictly. Re-run a step if JSON is invalid.
- Keep prompts modular; inject only necessary inputs per step.



