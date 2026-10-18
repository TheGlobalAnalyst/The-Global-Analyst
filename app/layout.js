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
    icon: [
      { url: '/tga-favicon-v2.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/tga-favicon-v2-32.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/tga-favicon-v2.ico',
    apple: [{ url: '/tga-apple-icon-v2.png', sizes: '180x180', type: 'image/png' }]
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
