import {subscribe} from '../../../lib/subscribe.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  return subscribe(request, {apiKey: process.env.TGA_BUTTONDOWN_API_KEY || process.env.BUTTONDOWN_API_KEY});
}
