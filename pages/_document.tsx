import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/google-maps-icon.png" />
        <link rel="apple-touch-icon" href="/google-maps-icon.png" />
        
        {/* Google Maps API */}
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places&callback=initMap`}
          async
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.initMap = function() {
                // Map will be initialized by the Map component
                console.log('Google Maps API loaded successfully');
              };
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}