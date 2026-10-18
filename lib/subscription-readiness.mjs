// Read-only provider authentication; never returns subscriber data.
let cached;
export async function subscriptionReadiness({apiKey, fetcher = fetch, now = Date.now()} = {}) {
  if (!apiKey) return false;
  if (cached && cached.key === apiKey && cached.until > now) return cached.available;
  let available = false;
  try {
    const response = await fetcher('https://api.buttondown.com/v1/subscribers?limit=1', {
      headers: {Authorization: `Token ${apiKey}`}, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    available = response.ok;
    await response.body?.cancel();
  } catch {}
  cached = {key: apiKey, until: now + 60000, available};
  return available;
}
