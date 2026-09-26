import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  metadataBase: new URL('https://www.theglobalanalyst.com'),
  title: {
    default: 'The Global Analyst',
    template: '%s | The Global Analyst'
  },
  description: 'AI-powered news and analysis from an independent analytical newsroom.',
  openGraph: {
    title: 'The Global Analyst',
    description: 'AI-powered news and analysis',
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
