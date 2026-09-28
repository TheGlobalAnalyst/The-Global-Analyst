import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = await mkdtemp(join(tmpdir(), 'tga-manifest-test-'));
const manifest = join(dir, 'published-articles.json');
process.env.TGA_PUBLICATION_MANIFEST = manifest;
process.env.TGA_PUBLICATION_FEED_URL = 'https://yugoifzlhfubxefawqqs.supabase.co/rest/v1/public_articles';
process.env.TGA_DEV_SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
const good = {
  canonical_key: 'one', slug: 'one', headline: 'A verified story', body_markdown: 'Body',
  publication_status: 'published', publication_approved: true, verification_state: 'verified',
  approved_at: '2026-09-28T00:00:00Z', published_at: '2026-09-28T00:01:00Z',
  citations: [{ url: 'https://example.com/1' }, { url: 'https://example.com/2' }],
};await writeFile(manifest, JSON.stringify([])); 
globalThis.fetch = async (url, options) => {
  assert.equal(url.searchParams.get('publication_status'), 'eq.published');
  assert.equal(url.searchParams.get('publication_approved'), 'eq.true');
  assert.equal(options.headers.apikey, 'public-test-key');
  return Response.json([good]);
};
await import('./sync-publication.mjs?case=publish');
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);

globalThis.fetch = async () => Response.json([{ ...good, publication_status: 'shadow_ready' }]);
await assert.rejects(import('./sync-publication.mjs?case=reject-draft'), /unapproved or incomplete/);
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);globalThis.fetch = async () => Response.json([{ ...good, citations: [{ url: 'javascript:alert(1)' }, { url: 'https://example.com/2' }] }]);
await assert.rejects(import('./sync-publication.mjs?case=reject-citation'), /unapproved or incomplete/);
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);



globalThis.fetch = async () => Response.json([]);
await assert.rejects(import('./sync-publication.mjs?case=empty'), /Refusing to replace/);
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);

globalThis.fetch = async () => new Response('Unavailable', { status: 503 });
await assert.rejects(import('./sync-publication.mjs?case=outage'), /HTTP 503/);
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);

process.env.TGA_PUBLICATION_FEED_URL = 'https://aohyrerainfeyhlchgde.supabase.co/rest/v1/public_articles';
await assert.rejects(import('./sync-publication.mjs?case=production-refused'), /exact HTTPS TGA DEV/);
assert.equal(JSON.parse(await readFile(manifest, 'utf8')).length, 1);
console.log('Publication manifest safety cases passed');
