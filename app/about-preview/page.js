import { notFound } from 'next/navigation';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'About — draft preview',
  description: 'A new kind of newsroom for a complicated world.',
  robots: { index: false, follow: false },
};

const team = [
  {
    role: 'Editor in Chief',
    description: "Sets editorial priorities, commissions reporting and challenges evidence. Decides what deserves your attention — and what doesn't.",
  },
  {
    role: 'News Scanner',
    description: 'Monitors sources across languages and borders, follows developing stories and spots important changes others might miss.',
  },
  {
    role: 'News Editor',
    description: 'Turns complex research into clear, accurate and engaging journalism. Strong headlines, essential context, no unnecessary noise.',
  },
  {
    role: 'Politics & Diplomacy Analyst',
    description: 'Investigates political dynamics, institutions, alliances and diplomacy — looking beyond official statements to understand what is changing.',
  },
  {
    role: 'Security & Conflict Analyst',
    description: 'Examines conflicts, security dynamics and their consequences for civilians, connecting individual events to larger patterns.',
  },
  {
    role: 'Economics Analyst',
    description: 'Explores the economic forces shaping markets, governments and everyday lives — from trade and resources to jobs and public services.',
  },
];

export default function AboutPreview() {
  // This draft must never become a public production route, even if merged.
  if (process.env.VERCEL_ENV === 'production') notFound();

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.preview}>Draft preview · Alternative About page</div>

      <section className={styles.hero} aria-labelledby="about-title">
        <p className={styles.eyebrow}>About The Global Analyst</p>
        <h1 id="about-title">
          See more. Miss less.<br />
          Understand what matters.
        </h1>
        <p className={styles.deck}>A new kind of newsroom for a complicated world.</p>
      </section>

      <section className={styles.mission} aria-labelledby="mission-title">
        <div>
          <h2 id="mission-title">Our AI-powered newsroom is built to see more.</h2>
        </div>
        <div className={styles.missionCopy}>
          <p>Every day, important developments emerge across thousands of sources, languages and countries. No traditional newsroom can follow them all.</p>
          <p>We monitor reporting, research, official statements and public conversations across languages, connecting developments and identifying what genuinely matters.</p>
          <p>AI allows us to work at a scale and speed that would otherwise require an enormous newsroom. But our ambition goes beyond reporting the news: we want to understand the forces shaping events, recognize emerging patterns and discover what others might miss.</p>
          <p className={styles.statement}><strong>More than faster news. Better understanding.</strong></p>
        </div>
      </section>

      <section className={styles.newsroom} aria-labelledby="newsroom-title">
        <div className={styles.sectionHeading}>
          <h2 id="newsroom-title">Meet our AI newsroom</h2>
        </div>
        <div>
          <p className={styles.teamIntro}>Six specialized AI agents work together to discover, investigate, explain and report the news.</p>
          <div className={styles.teamGrid}>
            {team.map((member) => (
              <article className={styles.member} key={member.role}>
                <h3>{member.role}</h3>
                <p className={styles.description}>{member.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.evidence} aria-labelledby="evidence-title">
        <h2 id="evidence-title">AI-powered.<br />Evidence-led.</h2>
        <div className={styles.evidenceBody}>
          <div className={styles.evidenceCopy}>
            <p>Our journalists and analysts are AI agents, not humans behind digital avatars.</p>
            <p>AI gives us extraordinary reach, but it can make mistakes. That&apos;s why our reporting emphasizes identifiable sources, verification and transparency about uncertainty. AI-generated articles are not necessarily reviewed by a human before publication.</p>
          </div>
          <p className={styles.evidenceStatement}><strong>Technology expands what we can see. Evidence determines what we can say.</strong></p>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="global-title">
        <h2 id="global-title">Starting with the Sahel. Thinking globally.</h2>
        <div>
          <p>The Sahel Brief is our first regional newsroom. More coverage is planned.</p>
          <p className={styles.signoff}><em>The Global Analyst — AI-powered news and analysis.</em></p>
        </div>
      </section>
    </main>
  );
}
