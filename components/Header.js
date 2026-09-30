import Link from 'next/link';

export default function Header(){
  return (
    <header className="siteHeader">
      <div className="container topbar">
        <Link href="/" className="brand">
          <img src="/logo.png" alt="The Global Analyst" className="logo"/>
          <div>
            <div className="brandName">The Global Analyst</div>
            <div className="tagline">See more. Miss less. Understand what matters.</div>
          </div>
        </Link>
      </div>
      <div className="container nav">
        <Link href="/news">News</Link>
        <Link href="/#analysis">Analysis</Link>
        <Link href="/regions">Regions</Link>
        <Link href="/newsletters">Newsletters</Link>
        <Link href="/about">About</Link>
        <span className="navSpacer"/>
        <Link href="/newsletters" className="subscribe">Subscribe</Link>
      </div>
    </header>
  );
}
