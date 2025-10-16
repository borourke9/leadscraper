# Google Places Scraper

A Next.js web application that finds local businesses missing a website using the Google Places API (v1 "Places API (New)") and displays the results on an interactive map.

## Features

- 🔍 Search for local businesses by keyword and location
- 🗺️ Interactive Google Maps with business markers
- 📊 Filter results to show only businesses without websites
- 📱 Responsive design with TailwindCSS
- 📄 Export results to CSV
- ⚡ Real-time search with loading states
- 🎯 Customizable search radius

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Google API Key:**
   - Copy `.env.local` and add your Google API key:
   ```bash
   GOOGLE_API_KEY=your_actual_api_key_here
   ```

3. **Enable required Google APIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the following APIs:
     - Places API (New)
     - Geocoding API
     - Maps JavaScript API

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a business keyword (e.g., "electrician", "plumber", "dentist")
2. Specify a city and state (e.g., "Traverse City, MI")
3. Set the search radius in meters (default: 10,000m)
4. Click "Search Places" to find businesses
5. View results on the map and in the list
6. Export results to CSV if needed

## API Endpoints

- `GET /api/search` - Search for businesses without websites
  - Query parameters: `keyword`, `location`, `radius`

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Google Places API (New)** - Business data
- **Google Maps JavaScript API** - Interactive maps
- **Google Geocoding API** - Location conversion

## Project Structure

```
├── components/
│   └── Map.tsx              # Google Maps component
├── pages/
│   ├── api/
│   │   └── search.ts        # API endpoint
│   ├── _app.tsx            # App wrapper
│   ├── _document.tsx       # Document wrapper
│   └── index.tsx           # Main page
├── styles/
│   └── globals.css         # Global styles
├── .env.local              # Environment variables
└── package.json            # Dependencies
```

## Environment Variables

Create a `.env.local` file with:

```
GOOGLE_API_KEY=your_google_api_key_here
```

## License

MIT
