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
        <title>Google Places Scraper</title>
        <meta name="description" content="Find local businesses without websites" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Service Business Scraper
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Find service contractors without websites (electricians, HVAC, plumbers, etc.)
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form and Results */}
            <div className="space-y-6">
              {/* Search Form */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Search Parameters</h2>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_CATEGORIES.map((category) => (
                        <label key={category.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.value)}
                            onChange={() => handleCategoryChange(category.value)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || selectedCategories.length === 0}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Search Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Total searched:</span> {summary.totalSearched}
                    </div>
                    <div>
                      <span className="text-blue-600">Without websites:</span> {summary.withoutWebsites}
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-600">Location:</span> {summary.location} ({summary.radiusMiles} miles)
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-600">Categories:</span> {summary.categories.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Service Businesses Found</h2>
                  {businesses.length > 0 && (
                    <button
                      onClick={exportToCSV}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {businesses.map((business, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{business.name}</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {business.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{business.address}</p>
                      {business.phone && (
                        <p className="text-sm text-gray-600 mb-1">📞 {business.phone}</p>
                      )}
                      {business.rating && (
                        <p className="text-sm text-yellow-600">⭐ {business.rating.toFixed(1)}</p>
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
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Map View</h2>
              <div className="h-96 lg:h-full min-h-96">
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
