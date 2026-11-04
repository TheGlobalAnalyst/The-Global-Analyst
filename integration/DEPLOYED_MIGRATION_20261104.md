# Hyperagent public migration — deployed 4 November 2026

This record supersedes the earlier activation blockers in PUBLIC_MIGRATION.md.

## Production

- PR21 merged as2158fbef8ad09b3c1b37513877589dfbc1318b0e; tested follow-ups9907dfbe6f50fb9b2e3db1ec28ebcc4793307e2d and167b2c08e89a368427d9ff634da51e4f9664ecd2 are on main.
- Website https://www.theglobalanalyst.com; code deployment dpl_6HGyZjbJhDkF1D5iY2ieWyD5MCxv READY. Project prj_SBeR69eagRNAR41v9A2F2GhC5egp, team team_XF4TSvuYbiB13D3swnL5SqMz.
- Production TGA_PUBLIC_NEWSROOM=hyperagent and TGA_LEGACY_PUBLIC_CUTOFF=2026-11-04T20:14:31.901Z. New V0/V2/Python articles are excluded from public listings, sitemap and direct public article routes. Historical URLs remain. Hyperagent supplies the entire homepage; later baseline reporting-window clocks cannot displace it.
- No baseline jobs, schedules, private newsletters or unlisted /challenger/ pages were changed. baseline-cutover.sql was NOT executed; the website boundary controls public intake.
- Supabase yugoifzlhfubxefawqqs Gateway edge version17/code0.3.0; exact original version13/code0.2.4 in gateway-v13/. Client tga_95e0c495eaa892e1902c81282db3e535 enabled:true/live:true. Owner reauthorization refreshed its stale tool catalog.

## Delivered articles and authorship

Hidden key tga-sah-20261104-v1-hidden; public key tga-sah-20261104-v1-public. Full operation key: op:tga_95e0c495eaa892e1902c81282db3e535:tga-sah-20261104-v1-public. Real MCP dry run returned public_promotion_validated/published:false/article_count7; real promotion public_ready; EIC public verification public_content_verified/article_count7.

| Label | Public path | Actual writer |
|---|---|---|
| Sudan | /articles/v0-65507582f5f742509d04361d | News Editor |
| Burkina Faso | /articles/v0-864f3f46509642e39bbb3ae9 | News Editor |
| West Africa | /articles/v0-92f28778f6be47f0a2c42e49 | Economics & Livelihoods Analyst |
| Mali | /articles/v0-8e6b27902d9c46138c71bd2b | News Editor |
| Mauritania | /articles/v0-d97eb4dd42f142b09582e735 | News Editor |
| Chad | /articles/v0-17aa2a15ce3141c383fd94ef | News Editor |
| Sahel | /articles/v0-65bcecde68444f7283d6be37 | News Editor |

Native provenance: approved edition cmw1qd37e034f07adirqsczhs v1; News Editor revision cmw1qa9b6033n07adrswiu211 v1; Economics original cmw1q03vs03dp06ad0h8y4zgs v3 and ledger cmw1q28da03ef06ad35fdgyfu. Topic is never used to infer authorship. Specialist originals retain credit after Editor integration. Exact agent IDs, role names and receipt-order article slug bindings are validated.

Linked bylines show Author · 4 November 2026 below the teaser. Geographical labels replace generic lead/type labels. Public article views omit internal edition metadata. Exact disclosure: “Produced by The Global Analyst’s AI-powered newsroom.” Today's already-accepted owner newsletter was never resent. No subscriber mail or social action occurred.

## Safeguards and tests

Gateway compares full hidden approved rendered body, headline, teaser, raw hash and source links before promotion. The service-only SECURITY INVOKER RPC locks the hidden edition, rejects changed/duplicate operations and content, promotes atomically and retains exact private before-images in public:<operation>. Public verification checks full text, sources, author-profile link, disclosure and HTML indexability. Both APIs use the same stable public key. No blind retries or new-key bypasses.

The first real promotion failed for missing service_role UPDATE privileges. Operator reconciliation confirmed zero changed rows and zero receipts. Added ONLY UPDATE(article,publication_approved) to service_role; anonymous/authenticated rights unchanged. Tested all7 under SET LOCAL ROLE service_role inside a rolled-back transaction, confirmed no leftovers, then explicitly retried the identical payload/key successfully. No SECURITY DEFINER workaround.

23 tests pass; Next15.5.28 production build passes. Protected previews verified all7 public/unlisted pages, approved content/hashes/sources, geography, linked author/date and disclosure. Real EIC Gateway hidden/public checks each succeeded for7articles. A private preview cutoff06:30Z proved the06:41V2baseline /articles/v0-49703e1d12e94275432cf79f returns404 while its /challenger/ route returns200; HA and an October historical article remain200. Production uses the later cutoff above. No mail/subscribe POST was tested. Supabase advisory scan returned INFO-only existing RLS/no-policy findings; Gateway state remains private.

Final production smoke test:17routes returned200 (home, news, both credited author profiles, historical article, newsletters, regions, about, sitemap, robots and all7newarticles), with no noindex response header. Full public rendered-body verification passed for7articles on the live domain. All7 homepage article links belong to the approved HA edition; Sudan is the hero. All7 are in the public sitemap. Database readback confirms7promoted rows and7original before-images; anon/authenticated cannot execute promotion.

## Morning workflow: remaining limitation

EIC Charter cmvi86olm0lzk07adebf4s199, sectionSb1S6FZ9 changed128→129→130. Only the old delivery paragraph was replaced with prospective daily website authority and exact API guidance: immutable native approval → stage → hidden publication → full hidden verification → public promotion with actual-author provenance/geography → public verification → ONE existing owner-only newsletter. Uncertain/partial outcomes stop; definitive failure permits the established private fallback as an alternative send. It explicitly supersedes historical hidden-only/public-feed prohibitions prospectively. All unrelated text and other13sections were compared unchanged.

Private backup cmw2jzuok0do407adi09rqz6w v2 contains pre-edit section/version and exact inverse replacements. Complete original v128 is also saved privately. Audit cmvi86op10l7t07adeyk4da88 records reservations/reconciliation/verification.

UNRESOLVED: EIC cannot expose GetAgentConfig, UpdateAgentConfig or ConfigureAutomation. CreateAgentConfig creates a new agent and was not used. The actual existing morning invocation Message has not been inspected/edited or confirmed to consume Charterv130. Therefore unattended future daily publication is NOT yet fully configured or demonstrated. Inspect the saved morning schedule through supported settings UI, back up its exact Message, and replace only stale delivery restrictions. Do not create a new schedule or change time/model/budget/recipients. No schedule change or new edition run is claimed.

## Exact rollback

1. Stop new public mutations in Supabase SQL Editor:

```sql
update public.tga_gateway_state set value=jsonb_set(value,'{live}','false')
where key='public-client:tga_95e0c495eaa892e1902c81282db3e535';
```

2. In Vercel project theglobalanalyst set production TGA_PUBLIC_NEWSROOM=legacy, then restore original production deployment dpl_HHcU6ynQWieBNBKyWTTh3hx34f2R, commit b866eb7e2218587066c3ff4505a3ec9f2a26b64e. Authenticated CLI:

```sh
vercel rollback dpl_HHcU6ynQWieBNBKyWTTh3hx34f2R --scope the-global-analyst
```

Verify domain aliases and homepage. A Vercel rollback can pause auto-assignment of new production deployments; intentionally promote a later tested release to resume.

3. To undo today's data promotion, run the complete checked-in integration/gateway/rollback-20261104.sql. Its exact key is already filled in. It locks the edition, refuses changed/newer row ownership, restores only original article JSON/approval values, and appends a rollback receipt. Original immutable receipts remain. Other editions require their own verified before-images; do not substitute keys or rerun blindly.

4. For full Gateway reversal, deploy the seven exact gateway-v13 files, entrypoint index.ts, import map deno.json, verify_jwt:false as originally configured with application auth. Revoke only the newly added column grants:

```sql
revoke update(article,publication_approved) on public.challenger_v0_articles from service_role;
```

Keep provider/OAuth state and private receipts. The dormant public RPC can remain service-only with live:false.

5. Restore only the Charter delivery/API replacement using private backup cmw2jzuok0do407adi09rqz6w v2, comparing current text first and preserving unrelated later edits. If the schedule Message is subsequently changed, retain a separate verified before-image and reverse only that Message edit.

6. No producer jobs or baseline trigger need re-enabling. The separately authorized owner-key reset need not be undone; prior hash is privately backed up at rollback:operator-owner:20261104-reset if an access rollback is separately required. Never commit credential values.
