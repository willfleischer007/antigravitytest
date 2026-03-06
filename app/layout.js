import '@/styles/globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>MBA Decision Engine</title>
        <meta name="description" content="A hyper-functional relic for comparing MBA programs" />
      </head>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
