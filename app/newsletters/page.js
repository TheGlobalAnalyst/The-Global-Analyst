import SubscribeForm from '../../components/SubscribeForm';

export const metadata = {title:'Newsletters'};

export default function Newsletters(){
  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">Email briefings</div>
        <h1>Newsletters</h1>
        <p>Start with what changed, why it matters and where the evidence leads. Our briefings draw on broad monitoring, verification and the context of earlier developments.</p>
      </section>
      <section className="newsletterCards">
        <article className="newsletterCard">
          <div className="kicker">Daily · Sahel</div>
          <h2>The Sahel Brief</h2>
          <p>A clear daily briefing on Mali, Niger, Burkina Faso, Mauritania, Chad and the wider Sahel. See the developments worth your attention, the context behind them and our strongest reporting.</p>
          <SubscribeForm/>
        </article>
        <article className="newsletterCard" style={{opacity:.48}}>
          <div className="kicker">Coming later</div>
          <h2>More regional briefs</h2>
          <p>More regional and thematic briefings will follow as our coverage grows.</p>
        </article>
      </section>
    </main>
  );
}
