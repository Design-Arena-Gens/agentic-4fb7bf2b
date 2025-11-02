export const metadata = {
  title: 'DJ Snakes',
  description: 'Interactive snake sequencer and visualizer',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
