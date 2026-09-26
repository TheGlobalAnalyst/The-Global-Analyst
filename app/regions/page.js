export const metadata = {title:'Regions'};

export default function Regions(){
  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">Coverage</div>
        <h1>Regions</h1>
        <p>The Sahel is the first active newsroom vertical. Additional regional briefs can be added without changing the website's publication model.</p>
      </section>
      <section className="section">
        <article className="newsletterCard" style={{maxWidth:'700px'}}>
          <div className="kicker">Active</div>
          <h2>The Sahel</h2>
          <p>Mali, Niger, Burkina Faso, Mauritania, Chad and materially relevant regional developments.</p>
        </article>
      </section>
    </main>
  );
}
