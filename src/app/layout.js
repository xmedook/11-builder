import './globals.css';

export const metadata = {
  title: 'Escarabajos Franco',
  description: 'Organiza tus partidos y alineaciones',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <main className="container">
          <div className="header">
            <h1>🪲 <span className="text-gradient">Escarabajos Franco</span> 🇫🇷</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Organiza tus partidos y alineaciones</p>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
