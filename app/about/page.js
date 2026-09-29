export const metadata = {title:'About'};

export default function About(){
  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">About</div>
        <h1>See more. Miss less. Understand what matters.</h1>
        <p>Important developments are scattered across local reporting, official statements, specialist sources and languages. No reader can follow every thread. The Global Analyst monitors that wider information landscape, connects new events to what came before, and focuses on the changes that matter. Our AI-supported newsroom researches and drafts reporting under publication rules that require sourcing, verification and clear treatment of uncertainty.</p>
      </section>
      <section className="section">
        <div className="integrationNote">
          <strong>How we work:</strong> We use AI to monitor and organize information at scale, then apply independent verification and editorial checks before publication. Articles identify their analyst role, carry an AI disclosure and show source links so readers can inspect the evidence.
        </div>
      </section>
    </main>
  );
}
