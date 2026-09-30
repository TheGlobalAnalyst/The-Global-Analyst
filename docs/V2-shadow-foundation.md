# V2 shadow foundation — 30 September 2026

## Boundary
- V1.2 production workflow: `ETEqN6j1vzlIYx7f` remains the published daily engine at 07:25 Europe/Berlin. No V2 publishing edge is connected to it.
- V2 baseline workflow: `lUkaBEszINDekMNR` is an unpublished duplicate of the full 41-node V1.2 newsroom, including discovery, selection, specialist research, drafting, verification and canonical output. The copied production persistence/distribution nodes are retained for contract reference but disconnected from `Canonical Payload` in the V2 copy; the copied schedule is inactive. Never manually run a copied send branch. V1.2 remains untouched.
- V2 memory sidecar: `vMkvx2gjPqJ5zNNk` remains an unpublished diagnostic workflow. It uses the managed `Supabase account 2` credential to idempotently refresh approved published V1 memory in DEV, then read memory, premium context and candidate readiness. These functions are intended to feed the full V1.2-based V2 workflow, not replace its newsroom engine.
- DEV Supabase project: `yugoifzlhfubxefawqqs`. Production Supabase project is outside this work.

## Implemented in DEV
Supabase migration history contains:
1. `tga_v2_evidence_linked_memory_core`
2. `tga_v2_editorial_feedback_personalities_commissions`
3. `tga_v2_bounded_historical_context_retrieval`
4. `tga_v2_bounded_premium_commissioning_context`
5. `tga_v2_feedback_rule_conflict_guard`
6. `tga_v2_idempotent_published_v1_shadow_ingest`
7. `tga_v2_service_role_read_published_v1_sources`
8. `tga_v2_premium_candidate_readiness_gate`
9. `tga_v2_correct_premium_readiness_48h_window`
10. `tga_v2_idempotent_country_entity_links`
11. `tga_v2_bounded_daily_selection_context`

The V2 tables cover entities and aliases, developments and lineage, claims and cited evidence, source intelligence, dossiers, watch items, feedback, versioned rules and conflicts, analyst personalities, premium commissions, and decision audit. All V2 tables have RLS enabled, with service-role-only access and no anon or authenticated policy.

A selective seed from approved published V1 articles currently provides 19 developments, 60 claims, 85 evidence links across 53 source hosts, 15 research dossiers, and 48 unresolved watch items. Source hosts have deliberately unknown independence and origin classifications until assessed. Imported evidence is historical context, never fresh proof. Four explicit V2 policy rules and three distinct specialist profiles are active.

`tga_v2_retrieve_development_context` returns a bounded, evidence-linked historical snapshot for one canonical key. `tga_v2_premium_commissioning_context` returns bounded recent developments, open watch questions, dossiers, active rules, specialist lenses and prior premium items for the fixed formats Analysis, Background and Did You Know. Both functions are executable by service_role only. The V2 n8n manual workflow successfully read both endpoints. An idempotent ingest RPC is installed; an admin-context repeat run and a managed-credential n8n repeat run returned zero new rows.

Feedback is stored verbatim. `tga_v2_propose_rule_from_feedback` creates a proposed version and flags a same-key change against an active rule for review. It does not silently activate or replace the old rule.

## V1.2-based V2 selection integration
The unpublished V2 copy now routes `Recent DEV Story Memory` through `Retrieve V2 Editorial Context — DEV` before `Editorial Packet`. The new POST calls `tga_v2_daily_selection_context` with the existing managed `Supabase account 2` credential. The RPC returns a bounded selection context (four active rules, up to eight developments and eight watch questions) marked as historical only and requiring fresh evidence. The packet builder still reads the original recent V1.2 stories by node reference, and adds `v2_context` to the selection payload. The copied Editorial Selection prompt explicitly treats `v2_context` as bounded historical memory, applies active rules and unresolved watch questions only to guide fresh checks, and forbids it as current proof, dates, quotations, causality, or independent corroboration. A reload verified the saved prompt. This is a selection-context integration, not a premium generator. Reload verified both new edges, the saved packet code, the unpublished workflow, and the absence of `Canonical Payload` → `Persist TGA V1 Run`. No paid or publishing execution was triggered.

## Validation
- Retrieved claims included source URLs, verification state, `historical_only=true`, and `requires_fresh_evidence=true`.
- Premium context returned 18 recent developments, 18 watch questions, 12 dossiers, four rules and three specialist profiles in one bounded response.
- Anon cannot execute either retrieval function; service_role can execute the development retrieval function.
- The n8n V2 workflow was reloaded and its manual trigger and read nodes persisted.

## Daily shadow ingestion
The user explicitly approved `service_role` SELECT on the six published V1 source tables: `public_articles`, `tga_v1_stories`, `tga_v1_claims`, `tga_v1_claim_evidence`, `tga_v1_signals`, and `tga_v1_research_dossiers`. The DEV migration grants only these reads. `has_table_privilege` verified all six. The separate daily shadow ingest workflow (`aWSQp90xxkFjSgas`) uses the managed `Supabase account 2` credential and a 10:00 Europe/Berlin schedule. Its manual run succeeded with `shadow_only=true` and zero new rows on an idempotent repeat. Workflow publication was confirmed in n8n. A second managed-credential step now links country entities after ingestion; manual end-to-end rerun returned zero additions and the revised workflow was published. V1.2 production workflow was not changed.

## Explicit geographic entities
Nine unambiguous country labels from published development metadata were seeded as location entities and linked to 19 developments with 30 geographic-context relations. `tga_v2_sync_country_entities()` is idempotent and service-role-only; it does not infer organizations or people. An immediate repeat returned zero new entities and links. Future unrecognized country labels require deliberate mapping.

## Premium readiness gate
A service-role-only `tga_v2_premium_candidate_readiness(date)` RPC returns a bounded shortlist of recent developments, a deterministic suggested specialist and explicit research and verification blockers. Fresh evidence is a rolling 48-hour window ending at the earlier of the edition day's end or now. Historical imported V1 evidence is never counted as current. The manual V2 n8n workflow now refreshes approved published V1 memory before the read chain and calls the RPC after premium context retrieval, using the same managed DEV credential. A complete one-button manual run succeeded across all six nodes; the refresh receipt added zero rows on an idempotent repeat. The current 19 candidates have zero fresh research sources and zero verification-ready candidates; no premium piece was commissioned or published. The specialist suggestion is provisional routing, not editorial selection.

## Activation and subscriber handover (provisional)
- Current activation: none for the V1.2-based V2 copy. It is unpublished and its copied `Canonical Payload` has no connection to copied V1 persistence/distribution. The independent V1.2 production schedule remains the only live newsroom publication path; the 10:00 V2 memory ingest is already active but produces no subscriber output.
- Release steps when the acceptance gates pass: verify an unattended V1.2 run and three premium shadow outputs; check citations, distinct formats, specialist choices, newsletter/site/social consistency, idempotent receipts and cost; then reconnect the validated V2 canonical output to the existing publication contract, explicitly replace the V1.2 schedule with one V2 schedule, and verify first live receipts. Never run two publishing schedules simultaneously.
- Measured baseline: three complete 29 September V1.2 DEV editions recorded estimated external cost of €5.2363, €5.5512 and €5.6880. These are model-accounting estimates, not billed totals. V2 daily premium cost is unmeasured; the €10/day newsroom ceiling leaves roughly €4.31–€4.76 above those observed V1.2 totals, before extra V2 calls. No activation cost claim is justified until full V2 shadow runs stay within the ceiling.
- Subscriber target after activation: the ordinary daily news edition continues, with full verified articles on the website and a concise linked newsletter. V2 adds one substantive Analysis, one durable Background and one short, rigorously checked Did You Know each day when quality permits, each assigned to the best-qualified Security, Political or Economic Analyst. Selected social posts link to the same canonical website items. The three premium pieces are additional products, not relabeled news briefs.

## Still experimental
- Only explicit country links are populated; actor/entity resolution and source dependency assessment remain open.
- Watch items were seeded from historical unresolved questions; they need fresh checks and editorial triage.
- Cross-key natural-language rule contradiction detection, rule activation review, and ongoing feedback ingestion are pending.
- Premium editorial selection, dynamic specialist commissioning, three distinct drafts, independent verification, outcomes and audit population are pending. The provisional specialist router is present, but not yet a commission.
- No V2 output is authorized to publish. V1.2 schedule, dispatch receipts and first unattended run still need operational observation.

## Next implementation sequence
0. Selection now receives bounded V2 memory and rules. Extend targeted context into research and verification while preserving the existing canonical output contract. Keep the copied publication edge disconnected until shadow validation.
1. Observe the first unattended V1.2 run and verify website, Buttondown, X and LinkedIn receipts; observe the next 10:00 V2 ingestion execution.
2. Add fresh multilingual source discovery and evidence capture, assess source origin/dependencies, then independently verify current claims. Keep imported V1 evidence historical.
3. Resolve recurring actors and link follow-ups to developments; ingest Publisher feedback and review rule conflicts.
4. Commission Analysis, Background and Did You Know from fresh evidence in shadow with specialist selection, cost accounting, decision audit and independent verification.
5. Compare repeated shadow editions with V1.2 and connect V2 production only after editorial and operational gates pass.
