export const metadata = {
  title: 'Autonomous Trading Agent',
  description: 'Deployment status page',
}

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, sans-serif; background: #1a1a1a; }
  .container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .content { max-width: 640px; }
  .title { color: #fff; font-size: 48px; font-weight: 500; margin-bottom: 32px; line-height: 1.2; }
  .description { color: #a0a0a0; font-size: 20px; margin-bottom: 48px; }
  .button { display: inline-block; padding: 14px 64px; background: transparent; color: #d4a574; border: 1.5px solid #d4a574; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; transition: all 150ms; font-size: 13px; }
  .button:hover { background: rgba(212, 165, 116, 0.1); }
  .button:active { transform: scale(0.98); }
  @media (max-width: 640px) {
    .title { font-size: 32px; }
    .description { font-size: 18px; }
    .button { width: 100%; max-width: 280px; }
  }
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <style>{styles}</style>
        {children}
      </body>
    </html>
  )
}
