# Hyperagent public migration — 4 November 2026

## Implementation
PR #21 carries frontend, portable live Gateway source, exact v13 rollback source, service-only transactional promotion SQL, staged baseline feed trigger and tests. No subscriber or social authorization is added.

Public API: tga_publish_public_edition(idempotency_key,payload:{hidden_key,eic_approved:true,authors:[{article_slug,author_role_slug,author_role,author_agent_id,authorship_evidence}],geography_labels:[...],dry_run:true|false}). Arrays follow exact hidden article order and each author entry is explicitly bound to its hidden receipt slug. Unknown/mismatched writer identity fails. No topic-based authorship inference. A source editor's integration does not displace the originating specialist's credit.

Operator config public-client:tga_95e0c495eaa892e1902c81282db3e535 controls enabled and live independently. Existing OAuth hidden consent alone cannot grant public rights. Current live:false supports dry-run only. Public SQL RPC is SECURITY INVOKER, service-role-only, atomically locks the hidden edition, rejects changed keys/content/duplicate edition promotion, retains before-images in private public:<operation> rollback_rows. Website readback precedes promotion; tga_verify_public_edition checks public content, author links, source links and exact disclosure. Unknown responses must be reconciled through receipt.get, never a new-key retry.

## Remaining activation steps (do not skip)
1. Obtain access to Vercel team team_XF4TSvuYbiB13D3swnL5SqMz/project prj_SBeR69eagRNAR41v9A2F2GhC5egp. Existing connection returned403; no substitute account is authorized.
2. Stage tested branch with TGA_PUBLIC_NEWSROOM=hyperagent and TGA_LEGACY_PUBLIC_CUTOFF set to actual cutover UTC. Preview must use correct public Supabase URL/key. Verify historical URLs, author pages, source links and labels on real preview before production.
3. Validate current approved edition through Gateway dry_run, preserving today's already-accepted owner send. No regenerated copy or subscriber email.
4. Stage/promote tested production website, then enable public-client live:true and promote ONLY the provenance-verified approved edition. Inspect receipt and verify all public pages, homepage, archive and author pages. Public URLs are /articles/<existing hidden slug>; unlisted URLs remain stable for private newsletters.
5. Only after full verification, activate frontend source switch in production and run baseline-cutover.sql. Keep baseline jobs/private newsletters operational; historical rows are preserved. Legacy Python freshness is blocked by frontend cutoff; no legacy data deletion.
6. Apply backed-up EIC charter delivery replacement with exact verified API contract. Morning Invocation's recorded hidden-only prohibition is superseded only by explicit current owner instruction; verify next real run, never claim live schedule changed through unavailable config tools.

## Exact rollback
- Disable new public mutations: update public.tga_gateway_state set value=jsonb_set(value,'{live}','false') where key='public-client:tga_95e0c495eaa892e1902c81282db3e535'.
- Set Vercel TGA_PUBLIC_NEWSROOM=legacy; restore/promote previous recorded production deployment. Do not destroy articles/history.
- To reverse an edition promotion, in a transaction lock its operation and hidden key; restore only challenger_v0_articles.article and publication_approved from that operation's private rollback_rows after verifying current public_operation_key still equals that operation. Keep the receipt, mark rollback explicitly, and never delete or overwrite unrelated/newer editions.
- If activated, DROP TRIGGER tga_baseline_private_feed ON public.challenger_v0_articles; old jobs resume feeding new editions. Rows created while private remain unlisted unless separately authorized.
- Redeploy exact integration/gateway-v13 source with deno.json and index.ts, verify_jwt=false (existing application-layer auth). It restores Gateway0.2.4 and previous hidden/private-owner route. Do not remove provider credentials or OAuth state.
- Restore only the charter delivery paragraph from its pre-edit snapshot; preserve later newsroom history/discovery guidance.

## Validation record
21 frontend/public Gateway unit and regression checks passed; Next15.5.28 production build passed (existing CSS alignment warning). These are not live public publication verification. Vercel access is a deployment blocker until consent is completed. No morning workflow authority is changed until deployed route is verified.

## Actual session state after implementation
- Supabase Gateway deployed as edge version16, code0.3.0; original version13/code0.2.4 captured in gateway-v13.
- Public RPC installed and transaction-tested against the existing seven approved4Nov hidden articles. Initial test caught the existing state-kind constraint; corrected by using the existing edition kind. Successful replay, changed-hash rejection and seven before-images asserted; transaction rolled back. Verified0 public HA rows and0 leftover test promotion rows.
- Anonymous/authenticated cannot execute promotion RPC; service_role can. Client enabled:true/live:false; no public mutations allowed.
- EIC confirmed code0.3.0 status through real connected integration, but new promotion/verification actions absent in its cached action catalog. No live HTTP dry-run result is claimed. Action-catalog refresh and Vercel team consent remain blockers.
- Morning charter unchanged; proposed exact delivery replacement retained in EIC threadcmw166ax200k307adkdyofbk6. Current public baseline route remains operational. No email/social actions performed.

- GitHub/Vercel Git integration built commit b15929583a1acc3bb103a3b8cf94bff05f7f0294 successfully. Preview https://theglobalanalyst-441zo7lir-the-global-analyst.vercel.app is protected and redirects to Vercel login, so it is NOT live-verified. Clean local production build completed after moving a stale .next directory aside.
