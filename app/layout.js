import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  metadataBase: new URL('https://www.theglobalanalyst.com'),
  title: {
    default: 'The Global Analyst',
    template: '%s | The Global Analyst'
  },
  description: 'Wider monitoring, verified reporting and lasting context on the developments that matter.',
  icons: {
    icon: [{ url: '/brand-tab-logo.jpg', type: 'image/jpeg' }],
    shortcut: '/brand-tab-logo.jpg',
    apple: '/brand-tab-logo.jpg'
  },
  openGraph: {
    title: 'The Global Analyst',
    description: 'See more. Miss less. Understand what matters. Verified reporting with wider context.',
    type: 'website',
    url: 'https://www.theglobalanalyst.com'
  }
};

export default function RootLayout({children}){
  return (
    <html lang="en">
      <body>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
