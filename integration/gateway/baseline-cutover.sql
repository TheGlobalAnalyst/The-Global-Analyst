-- Run ONLY after public Hyperagent readback, homepage/archive/author verification.
-- No existing rows or publication receipts are changed.
create or replace function public.tga_baseline_private_feed() returns trigger language plpgsql set search_path='' as $$
begin
 if new.article->>'origin' is distinct from 'tga_gateway' and new.article->>'feed_origin' in ('scheduled_v0','scheduled_v2','owner_approved_v2') then
  new.article:=new.article||'{"feed_visible":false}'::jsonb;
 end if;
 return new;
end $$;
revoke all on function public.tga_baseline_private_feed() from public,anon,authenticated;
create trigger tga_baseline_private_feed before insert on public.challenger_v0_articles for each row execute function public.tga_baseline_private_feed();
