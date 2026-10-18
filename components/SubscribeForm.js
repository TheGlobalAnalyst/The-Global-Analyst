'use client';

import {useRef, useState} from 'react';

export default function SubscribeForm() {
  const busy = useRef(false);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const fields = new FormData(event.currentTarget);
    setState('submitting'); setError('');
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: fields.get('email'), website: fields.get('website')})
      });
      const result = await response.json();
      if (!response.ok || result.status !== 'confirmation_requested') {
        throw new Error(result.error || 'We could not confirm your request. Please check your inbox before trying again.');
      }
      setState('success');
    } catch (failure) {
      setError(failure.message || 'We could not confirm your request. Please check your inbox before trying again.');
      setState('error');
    } finally { busy.current = false; }
  }
  if (state === 'success') {
    return <div className="signupSuccess" role="status" tabIndex={-1}>
      <h3>Check your inbox</h3>
      <p>We’ve requested a confirmation email. Follow the link in it to confirm your subscription to The Sahel Brief.</p>
      <p>If it hasn’t arrived, check your spam folder. You can keep reading while you wait.</p>
    </div>;
  }
  return <form className="signupForm" onSubmit={submit} aria-busy={state === 'submitting'}>
    <label htmlFor="sahel-email">Email address</label>
    <div className="signupFields">
      <input id="sahel-email" name="email" type="email" autoComplete="email" maxLength={254}
        placeholder="you@example.com" required disabled={state === 'submitting'} aria-describedby="signup-note signup-error"/>
      <button className="button" type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
    </div>
    <div className="signupTrap" aria-hidden="true">
      <label htmlFor="signup-website">Leave this field empty</label>
      <input id="signup-website" name="website" type="text" tabIndex={-1} autoComplete="off"/>
    </div>
    <p id="signup-note" className="signupNote">Confirm by email to subscribe. Unsubscribe at any time.</p>
    <p id="signup-error" role="alert" className="signupError">{error}</p>
    <noscript>Please enable JavaScript to use this subscription form.</noscript>
  </form>;
}
