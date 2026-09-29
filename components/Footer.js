import Link from 'next/link';

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container footerInner">
        <div>
          <div className="footerBrand">The Global Analyst</div>
          <div className="footerTag">See more. Miss less. Understand what matters.</div>
        </div>
        <div className="footerLinks">
          <Link href="/about">About</Link>
          <Link href="/newsletters">Newsletters</Link>
          <span>Corrections</span>
          <span>Contact</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}
