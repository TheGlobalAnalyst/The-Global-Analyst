export const metadata = {title:'Newsletters'};

export default function Newsletters(){
  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">Email briefings</div>
        <h1>Newsletters</h1>
        <p>Our newsletters surface the day's most important developments and point readers to The Global Analyst's strongest original reporting and analysis.</p>
      </section>
      <section className="newsletterCards">
        <article className="newsletterCard">
          <div className="kicker">Daily · Sahel</div>
          <h2>The Sahel Brief</h2>
          <p>A concise daily briefing on Mali, Niger, Burkina Faso, Mauritania, Chad and the wider Sahel.</p>
          <p><a className="button" href="https://buttondown.com/TheSahelBrief">Subscribe</a></p>
        </article>
        <article className="newsletterCard" style={{opacity:.48}}>
          <div className="kicker">Coming later</div>
          <h2>More regional briefs</h2>
          <p>Additional regional and thematic products will use the same newsroom and publication architecture.</p>
        </article>
      </section>
    </main>
  );
}
