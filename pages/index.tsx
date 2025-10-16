import { useState } from 'react'
import Head from 'next/head'
import Map from '@/components/Map'

interface Business {
  name: string
  phone?: string
  address: string
  rating?: number
  lat: number
  lng: number
  type: string
}

interface SearchSummary {
  totalSearched: number
  withoutWebsites: number
  city: string
  state: string
  location: string
  radiusMiles: number
  categories: string[]
}

const SERVICE_CATEGORIES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC Contractor' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'contractor', label: 'General Contractor' },
  { value: 'painter', label: 'Painter' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'auto_repair', label: 'Auto Repair' }
]

export default function Home() {
  const [city, setCity] = useState('Detroit')
  const [state, setState] = useState('MI')
  const [radiusMiles, setRadiusMiles] = useState('10')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['electrician'])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [summary, setSummary] = useState<SearchSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBusinesses([])
    setSummary(null)

    try {
      const params = new URLSearchParams({
        city,
        state,
        radiusMiles,
        categories: selectedCategories.join(',')
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search places')
      }

      setBusinesses(data.businesses)
      setSummary(data.summary)
      
      // Set map center to first business or default
      if (data.businesses.length > 0) {
        setMapCenter({ lat: data.businesses[0].lat, lng: data.businesses[0].lng })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryValue)
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    )
  }

  const exportToCSV = () => {
    if (businesses.length === 0) return

    const headers = ['Name', 'Type', 'Phone', 'Address', 'Rating', 'Latitude', 'Longitude']
    const csvContent = [
      headers.join(','),
      ...businesses.map(business => [
        `"${business.name}"`,
        `"${business.type}"`,
        business.phone ? `"${business.phone}"` : '',
        `"${business.address}"`,
        business.rating ? business.rating.toString() : '',
        business.lat.toString(),
        business.lng.toString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `service-businesses-${city.replace(/,/g, '-')}-${Date.now()}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <>
      <Head>
        <title>Google Places Scraper - Find Local Businesses Without Websites</title>
        <meta name="description" content="Find local service businesses without websites using Google Places API. Perfect for lead generation - electricians, HVAC, plumbers, and more!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://github.com/borourke9/leadscraper" />
        <meta property="og:title" content="Google Places Scraper - Find Local Businesses Without Websites" />
        <meta property="og:description" content="Find local service businesses without websites using Google Places API. Perfect for lead generation - electricians, HVAC, plumbers, and more!" />
        <meta property="og:image" content="/google-maps-icon.png" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://github.com/borourke9/leadscraper" />
        <meta property="twitter:title" content="Google Places Scraper - Find Local Businesses Without Websites" />
        <meta property="twitter:description" content="Find local service businesses without websites using Google Places API. Perfect for lead generation - electricians, HVAC, plumbers, and more!" />
        <meta property="twitter:image" content="/google-maps-icon.png" />
        
        {/* iMessage / Apple specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Places Scraper" />
        <link rel="apple-touch-icon" href="/google-maps-icon.png" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-4 sm:mb-6 lg:mb-8 px-2">
            Service Business Scraper
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 lg:mb-8 px-2">
            Find service contractors without websites (electricians, HVAC, plumbers, etc.)
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Form and Results */}
            <div className="space-y-4 sm:space-y-6">
              {/* Search Form */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Search Parameters</h2>
                <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-input"
                        placeholder="e.g., Detroit"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-input"
                        placeholder="e.g., MI"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                      Radius (miles)
                    </label>
                    <input
                      type="number"
                      id="radius"
                      value={radiusMiles}
                      onChange={(e) => setRadiusMiles(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                      min="0.1"
                      max="50"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Categories
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {SERVICE_CATEGORIES.map((category) => (
                        <label key={category.value} className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.value)}
                            onChange={() => handleCategoryChange(category.value)}
                            className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm text-gray-700 select-none">{category.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || selectedCategories.length === 0}
                    className="w-full bg-blue-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium touch-manipulation touch-button"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </div>
                    ) : (
                      'Search Service Businesses'
                    )}
                  </button>
                </form>
              </div>

              {/* Results Summary */}
              {summary && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Search Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Total searched:</span> {summary.totalSearched}
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Without websites:</span> {summary.withoutWebsites}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-blue-600 font-medium">Location:</span> {summary.location} ({summary.radiusMiles} miles)
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-blue-600 font-medium">Categories:</span> 
                      <div className="mt-1 flex flex-wrap gap-1">
                        {summary.categories.map((cat, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">Service Businesses Found</h2>
                  {businesses.length > 0 && (
                    <button
                      onClick={exportToCSV}
                      className="bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base font-medium touch-manipulation touch-button"
                    >
                      Export CSV
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {businesses.length === 0 && !loading && !error && (
                  <p className="text-gray-500 text-center py-8">
                    No service businesses found without websites. Try adjusting your search parameters or location.
                  </p>
                )}

                <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto mobile-scroll">
                  {businesses.map((business, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <h3 className="font-semibold text-base sm:text-lg text-gray-800 leading-tight">{business.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full self-start">
                          {business.type}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">{business.address}</p>
                      {business.phone && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          📞 <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">{business.phone}</a>
                        </p>
                      )}
                      {business.rating && (
                        <p className="text-xs sm:text-sm text-yellow-600">⭐ {business.rating.toFixed(1)}</p>
                      )}
                      <div className="text-xs text-red-600 mt-2 font-medium">
                        🚫 No Website Found
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Map View</h2>
              <div className="h-64 sm:h-80 lg:h-96 xl:h-full xl:min-h-96 mobile-map-container" style={{ minHeight: '200px' }}>
                <Map 
                  businesses={businesses} 
                  center={mapCenter} 
                  searchRadius={parseFloat(radiusMiles)} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
