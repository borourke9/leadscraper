#!/bin/bash

echo "🚀 Setting up Google Places Scraper..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔑 Creating .env.local file..."
    echo "GOOGLE_API_KEY=YOUR_API_KEY_HERE" > .env.local
    echo "NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_API_KEY_HERE" >> .env.local
    echo "⚠️  Please update .env.local with your actual Google API key"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get a Google API key from https://console.cloud.google.com/"
echo "2. Enable Places API (New), Geocoding API, and Maps JavaScript API"
echo "3. Update .env.local with your API key"
echo "4. Run 'npm run dev' to start the development server"
echo "5. Open http://localhost:3000 in your browser"
