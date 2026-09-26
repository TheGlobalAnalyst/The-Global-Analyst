# Handoff to ChatGPT Work

The website frontend is product-complete and integration-ready.

## Preserve
- Existing visual design and navigation.
- Homepage structure: Today's Original → Latest News → newsletter promotion → Analysis.
- Role-only author identities.
- Explicit AI disclosure.
- Newsletter remains an email product.
- Website is the full-article home for selected stories.

## Your task
Inspect the final V1 canonical newsroom output and DEV Supabase schema, then implement the simplest robust publication adapter between n8n/Supabase and this frontend.

Use the canonical verified story object as source of truth.

Keep internal newsroom persistence separate from the public website publication layer.

Do not redesign the website unless a technical integration constraint genuinely requires a small change.

## Publication safety
- Stay in DEV/shadow mode while integrating.
- Draft/shadow/ready states must not be readable by anonymous website visitors.
- Only publication_status='published' is public.
- Do not activate external publication without explicit authorization.

## Desired distribution flow

TGA V1 newsroom
→ verified canonical story
→ public publication object
→ full article on TheGlobalAnalyst.com
→ newsletter teaser + article link
→ social representation + article link

The exact database table/view/RPC/API design is yours to choose after inspecting the final V1 schema.
