import test from 'node:test';
import assert from 'node:assert/strict';
import {articleProfileSlug, articlesForProfile, getEditorialProfile} from '../lib/editorial-team.mjs';

test('current V2 and legacy Python News Editor credits resolve to one profile', () => {
  assert.equal(articleProfileSlug({author_role_slug:'general-analyst', author_role:'The Global Analyst — News Editor'}), 'news-editor');
  assert.equal(articleProfileSlug({author_role_slug:'the-global-analyst-news-editor', author_role:'The Global Analyst News Editor'}), 'news-editor');
  assert.equal(getEditorialProfile('the-global-analyst-news-editor').slug, 'news-editor');
});

test('do not assign general or topically related articles to specialist roles', () => {
  const rows = [
    {slug:'general',author_role_slug:'general-analyst',author_role:'General Analyst',topics:['conflict']},
    {slug:'editor',author_role_slug:'general-analyst',author_role:'The Global Analyst — News Editor',topics:['conflict']},
    {slug:'specialist',author_role_slug:'security-analyst',author_role:'Security Analyst'},
  ];
  assert.deepEqual(articlesForProfile(rows, getEditorialProfile('security-analyst')).map(a=>a.slug), ['specialist']);
  assert.deepEqual(articlesForProfile(rows, getEditorialProfile('general-analyst')).map(a=>a.slug), ['general']);
  assert.deepEqual(articlesForProfile(rows, getEditorialProfile('news-scanner')), []);
  assert.equal(getEditorialProfile('unknown'), null);
});

test('author archive keeps recorded attribution and orders latest publications first', () => {
  const rows = [
    {slug:'older',author_role_slug:'economic-analyst',published_at:'2026-10-20T07:00:00Z'},
    {slug:'newer',author_role_slug:'economics-analyst',published_at:'2026-10-27T07:00:00Z'},
  ];
  const before=JSON.stringify(rows);
  assert.deepEqual(articlesForProfile(rows,getEditorialProfile('economic-analyst')).map(a=>a.slug),['newer','older']);
  assert.equal(JSON.stringify(rows),before);
});
