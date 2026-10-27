import { notFound } from 'next/navigation';
import AboutContent from '../about/content';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'About — draft preview',
  description: 'A new kind of newsroom for a complicated world.',
  robots: { index: false, follow: false },
};

export default function AboutPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <AboutContent preview />;
}
