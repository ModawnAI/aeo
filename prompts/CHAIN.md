## AEO Evaluation Chain (Modular System Prompts)

Purpose: Evaluate search engine results JSON and LLM results JSON alongside a target content JSON, apply the AEO Context heuristics, score performance across pillars, and output prioritized, actionable improvements.

### Inputs (to be injected by your orchestrator)
- `GoogleSearchInput` JSON (array; see `schemas.json`)
- `PerplexityInput` JSON (array; see `schemas.json`)
- `AEO_CONTEXT_TEXT` string loaded from `AEO Context`
- Optional: `brand`, `domain`, `locale`, `targetRegion`

### Outputs
- `NormalizedIntake` JSON
- `AEOHeuristics` JSON
- `AEOScore` JSON with per-item rationales
- `Recommendations` JSON with prioritized, directly actionable edits

### Chain Steps
1) Intake Normalization → 01_intake.md
   - Validates and normalizes inputs into `NormalizedIntake`.

2) Context Priming → 02_context_priming.md
   - Distills `AEO_CONTEXT_TEXT` into machine-usable heuristics as `AEOHeuristics`.

3) Scoring → 03_scoring.md
   - Scores across Pillars I–V using `NormalizedIntake` and `AEOHeuristics` → `AEOScore`.

4) Recommendations → 04_recommendations.md
   - Generates prioritized, concrete content edits → `Recommendations`.

5) (Optional) Aggregation/Report
   - Your app can merge `AEOScore` + `Recommendations` into a final report.

### Orchestration Contract
- Inject inputs verbatim as JSON blocks.
- Each step’s system prompt must receive only what it needs (principle of least context) to reduce drift.
- Enforce strict JSON outputs matching `schemas.json`. Reject or re-ask on schema violations.

### Suggested Improvements (operational)
- Add a "Comparative Delta" run that re-scores after applying suggested edits to estimate uplift.
- Add an "Entity Consistency" submodule that checks Knowledge Panel, org schema, bios, and external profiles.
- Add a "Schema Validator" pass that outputs corrected JSON-LD blocks for copy-paste.
- Track a "Share of Voice in AI Answers" metric using consistent 10-query panels over time.
 - Add an optional "Competitor Page Audit" pass using `PageAudit` to explain why top URLs rank and how to emulate.


