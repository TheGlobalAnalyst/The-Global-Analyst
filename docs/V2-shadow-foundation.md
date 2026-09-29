# V2 shadow foundation — 29 September 2026

## Boundary
- V1.2 production workflow: `ETEqN6j1vzlIYx7f` remains the published daily engine at 07:25 Europe/Berlin. No V2 publishing edge is connected to it.
- V2 manual shadow workflow: `vMkvx2gjPqJ5zNNk` is separate and unpublished. Its existing steps read only from Supabase DEV using the managed `Supabase account 2` credential.
- DEV Supabase project: `yugoifzlhfubxefawqqs`. Production Supabase project is outside this work.

## Implemented in DEV
Supabase migration history contains:
1. `tga_v2_evidence_linked_memory_core`
2. `tga_v2_editorial_feedback_personalities_commissions`
3. `tga_v2_bounded_historical_context_retrieval`
4. `tga_v2_bounded_premium_commissioning_context`
5. `tga_v2_feedback_rule_conflict_guard`
6. `tga_v2_idempotent_published_v1_shadow_ingest`

The V2 tables cover entities and aliases, developments and lineage, claims and cited evidence, source intelligence, dossiers, watch items, feedback, versioned rules and conflicts, analyst personalities, premium commissions, and decision audit. All V2 tables have RLS enabled, with service-role-only access and no anon or authenticated policy.

A selective seed from approved published V1 articles currently provides 19 developments, 60 claims, 85 evidence links across 53 source hosts, 15 research dossiers, and 48 unresolved watch items. Source hosts have deliberately unknown independence and origin classifications until assessed. Imported evidence is historical context, never fresh proof. Four explicit V2 policy rules and three distinct specialist profiles are active.

`tga_v2_retrieve_development_context` returns a bounded, evidence-linked historical snapshot for one canonical key. `tga_v2_premium_commissioning_context` returns bounded recent developments, open watch questions, dossiers, active rules, specialist lenses and prior premium items for the fixed formats Analysis, Background and Did You Know. Both functions are executable by service_role only. The V2 n8n manual workflow successfully read both endpoints. An idempotent ingest RPC is installed; an admin-context repeat run returned zero new rows.

Feedback is stored verbatim. `tga_v2_propose_rule_from_feedback` creates a proposed version and flags a same-key change against an active rule for review. It does not silently activate or replace the old rule.

## Validation
- Retrieved claims included source URLs, verification state, `historical_only=true`, and `requires_fresh_evidence=true`.
- Premium context returned 18 recent developments, 18 watch questions, 12 dossiers, four rules and three specialist profiles in one bounded response.
- Anon cannot execute either retrieval function; service_role can execute the development retrieval function.
- The n8n V2 workflow was reloaded and its manual trigger and read nodes persisted.

## Access boundary discovered
A separate daily shadow ingest workflow (`aWSQp90xxkFjSgas`) has a 10:00 Europe/Berlin trigger and managed DEV credential, but remains **unpublished**. Its first manual call failed because that credential's `service_role` lacks SELECT on `public_articles`, `tga_v1_stories`, `tga_v1_claims`, `tga_v1_claim_evidence`, `tga_v1_signals`, and `tga_v1_research_dossiers`. Automatic approval review rejected the proposed persistent SELECT grant to these six V1 tables because the precise permission expansion had not been specifically authorized. No grant was applied, and the workflow will not be activated while this access is blocked. The V1.2 production workflow was not changed.

## Still experimental
- Entity resolution and source dependency assessment are not populated.
- Watch items were seeded from historical unresolved questions; they need fresh checks and editorial triage.
- Cross-key natural-language rule contradiction detection, rule activation review, and ongoing feedback ingestion are pending.
- Premium candidate evaluation, dynamic specialist assignment, three distinct drafts, verification, outcomes and audit population are pending.
- No V2 output is authorized to publish. V1.2 schedule, dispatch receipts and first unattended run still need operational observation.

## Next implementation sequence
1. Resolve recurring entities and link development lineage; assess original versus syndicated source chains.
2. Ingest new V1 outcomes into V2 shadow memory with provenance and bounded retrieval.
3. Add feedback intake and conflict review; preserve rule versions.
4. Commission Analysis, Background and Did You Know in shadow with dynamic specialist choice and audit trails.
5. Research, verify and compare shadow output against current V1.2 coverage before any production connection.
