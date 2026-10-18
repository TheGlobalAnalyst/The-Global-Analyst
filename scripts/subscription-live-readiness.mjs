const origin = 'https://www.theglobalanalyst.com';
let last = {};
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const page = await fetch(origin + '/newsletters?check=signup-v1', {signal: AbortSignal.timeout(10000)});
    const html = await page.text();
    const ready = await fetch(origin + '/api/subscribe', {signal: AbortSignal.timeout(10000)});
    const status = await ready.json();
    last = {native_form: html.includes('sahel-email'),
      external_signup_link: html.includes('href="https://buttondown.com/TheSahelBrief"'),
      provider_authentication: status.check === 'subscription-v1' && status.available === true};
    if (last.native_form && !last.external_signup_link && last.provider_authentication) {
      console.log(JSON.stringify({...last, emails_sent: 0, subscribers_changed: 0}));
      process.exit(0);
    }
  } catch (error) { last = {error_type: error.name}; }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
console.log(JSON.stringify(last));
process.exit(1);
