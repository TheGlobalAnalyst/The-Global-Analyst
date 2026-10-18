import Link from 'next/link';

export const metadata = {title: 'Subscription confirmation', robots: {index: false, follow: true}};
export default function Confirmed() {
  return <main className="container">
    <section className="pageHero">
      <div className="kicker">The Sahel Brief</div>
      <h1>Thank you for confirming</h1>
      <p>You can now return to our latest reporting.</p>
      <p><Link className="button" href="/news">Read the latest news</Link></p>
    </section>
  </main>;
}
