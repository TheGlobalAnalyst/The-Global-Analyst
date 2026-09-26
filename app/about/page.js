export const metadata = {title:'About'};

export default function About(){
  return (
    <main className="container">
      <section className="pageHero">
        <div className="kicker">About</div>
        <h1>Independent analysis, built for a faster information environment.</h1>
        <p>The Global Analyst is an AI-powered analytical newsroom. Its system discovers, researches, verifies and edits large volumes of information, while publication rules preserve sourcing, uncertainty and editorial discipline.</p>
      </section>
      <section className="section">
        <div className="integrationNote">
          <strong>AI-powered newsroom:</strong> Articles identify their analyst role and carry an explicit AI disclosure. Source links remain visible to readers.
        </div>
      </section>
    </main>
  );
}
