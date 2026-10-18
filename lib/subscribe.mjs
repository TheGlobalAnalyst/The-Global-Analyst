// Server-only handler: never import this module into a client component.
const ENDPOINT = 'https://api.buttondown.com/v1/subscribers';
const ORIGIN = 'https://www.theglobalanalyst.com';
function reply(status, body) {
  return Response.json(body, {status, headers: {'Cache-Control': 'no-store'}});
}

export async function subscribe(request, {apiKey, fetcher = fetch} = {}) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    return reply(403, {error: 'Please subscribe using the form on this website.'});
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return reply(415, {error: 'Please use the subscription form.'});
  }
  let data;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4096) return reply(413, {error: 'Please enter only your email address.'});
    data = JSON.parse(raw);
  } catch { return reply(400, {error: 'Please enter a valid email address.'}); }
  const email = typeof data?.email === 'string' ? data.email.trim() : '';
  if (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) {
    return reply(400, {error: 'Please enter a valid email address.'});
  }
  if (data.website) return reply(400, {error: 'We could not submit this form. Please try again.'});
  if (!apiKey) return reply(503, {error: 'Subscriptions are temporarily unavailable. Please try again later.'});
  try {
    // Exactly one request; never silently reactivate or overwrite an existing address.
    const response = await fetcher(ENDPOINT, {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: {'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json',
        'X-Buttondown-Collision-Behavior': 'no_op'},
      body: JSON.stringify({email_address: email, type: 'unactivated', referring_site: `${ORIGIN}/newsletters`})
    });
    if (response.status === 201) return reply(200, {status: 'confirmation_requested'});
    // No provider messages, subscriber details, or credentials are exposed to visitors.
    if (response.status === 429) return reply(429, {error: 'Too many requests. Please wait a few minutes before trying again.'});
    if ([400, 409, 422].includes(response.status)) {
      return reply(400, {error: 'We could not add this address. If you have subscribed before, check your inbox for a confirmation email; otherwise check the address and try again.'});
    }
    return reply(503, {error: 'Subscriptions are temporarily unavailable. Please try again later.'});
  } catch {
    // A timeout may follow an accepted request. Do not submit another automatically.
    return reply(503, {error: 'We could not confirm your request. Please check your inbox before trying again.'});
  }
}
