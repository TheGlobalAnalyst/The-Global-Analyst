import {subscribe} from '../../../lib/subscribe.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  return subscribe(request, {apiKey: process.env.TGA_BUTTONDOWN_API_KEY || process.env.BUTTONDOWN_API_KEY});
}

export async function GET() {
  const {subscriptionReadiness} = await import('../../../lib/subscription-readiness.mjs');
  const available = await subscriptionReadiness({apiKey: process.env.TGA_BUTTONDOWN_API_KEY || process.env.BUTTONDOWN_API_KEY});
  return Response.json({check: 'subscription-v1', available}, {
    status: available ? 200 : 503, headers: {'Cache-Control': 'no-store'}
  });
}
