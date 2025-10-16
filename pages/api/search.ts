import { NextApiRequest, NextApiResponse } from 'next'

interface Business {
  name: string
  phone?: string
  address: string
  rating?: number
  lat: number
  lng: number
  type: string
}

interface GeocodingResult {
  results: Array<{
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }>
}

interface PlacesResult {
  places: Array<{
    displayName: {
      text: string
    }
    formattedAddress: string
    websiteUri?: string
    nationalPhoneNumber?: string
    rating?: number
    location: {
      latitude: number
      longitude: number
    }
    types?: string[]
  }>
}

// Service business categories mapping - using multiple supported Google types
const SERVICE_CATEGORIES = {
  'electrician': ['electrician'],
  'hvac': ['electrician', 'plumber'], // Search both since hvac_contractor not supported
  'plumber': ['plumber'],
  'roofer': ['electrician', 'painter'], // Search both since roofing_contractor not supported
  'contractor': ['electrician', 'plumber', 'painter'], // Search multiple types
  'painter': ['painter'],
  'landscaper': ['painter', 'electrician'], // Search both since landscaping_contractor not supported
  'auto_repair': ['car_repair']
}

// Keywords to filter service businesses - expanded list
const SERVICE_KEYWORDS = [
  'electric', 'hvac', 'plumb', 'roof', 'repair', 'contract', 
  'heat', 'cool', 'paint', 'landscap', 'service', 'maintenance',
  'wire', 'electrical', 'heating', 'cooling', 'plumbing', 'roofing',
  'contractor', 'contractors', 'construction', 'install', 'installation',
  'hvac', 'heating', 'cooling', 'air', 'conditioning', 'furnace',
  'plumbing', 'plumber', 'pipe', 'drain', 'sewer', 'water',
  'roofing', 'roofer', 'roof', 'shingle', 'gutter', 'siding',
  'painting', 'painter', 'paint', 'interior', 'exterior',
  'landscaping', 'landscaper', 'lawn', 'yard', 'garden', 'tree',
  'auto', 'automotive', 'mechanic', 'garage', 'tire', 'brake',
  'handyman', 'handy', 'fix', 'repair', 'maintenance', 'service'
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { city = 'Detroit', state = 'MI', radiusMiles = '10', categories = 'electrician' } = req.query

  if (!process.env.GOOGLE_API_KEY) {
    console.error('Google API key not configured')
    return res.status(500).json({ error: 'Google API key not configured' })
  }

  console.log('API Key exists:', !!process.env.GOOGLE_API_KEY)
  console.log('Request params:', { city, state, radiusMiles, categories })

  try {
    // Step 1: Geocode the location to get lat/lng
    let lat: number, lng: number
    
    // Combine city and state for geocoding
    const fullLocation = `${city}, ${state}`
    
    // Fallback coordinates for common locations
    const locationFallbacks: { [key: string]: { lat: number; lng: number } } = {
      'detroit, mi': { lat: 42.3314, lng: -83.0458 },
      'chicago, il': { lat: 41.8781, lng: -87.6298 },
      'new york, ny': { lat: 40.7128, lng: -74.0060 },
      'los angeles, ca': { lat: 34.0522, lng: -118.2437 },
      'miami, fl': { lat: 25.7617, lng: -80.1918 },
      'traverse city, mi': { lat: 44.7631, lng: -85.6206 },
      'cadillac, mi': { lat: 44.2519, lng: -85.4012 },
      'grand rapids, mi': { lat: 42.9634, lng: -85.6681 },
      'kalamazoo, mi': { lat: 42.2917, lng: -85.5872 },
      'lansing, mi': { lat: 42.7325, lng: -84.5555 }
    }

    const locationKey = fullLocation.toLowerCase().trim()
    
    if (locationFallbacks[locationKey]) {
      ({ lat, lng } = locationFallbacks[locationKey])
      console.log(`Using fallback coordinates for ${fullLocation}: ${lat}, ${lng}`)
    } else {
      console.log(`Using Geocoding API for ${fullLocation}`)
      // Try Geocoding API as fallback
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullLocation)}&key=${process.env.GOOGLE_API_KEY}`
      
      const geocodingResponse = await fetch(geocodingUrl)
      const geocodingData: GeocodingResult = await geocodingResponse.json()

      if (!geocodingData.results || geocodingData.results.length === 0) {
        return res.status(400).json({ 
          error: `Location "${fullLocation}" not found. Please try: Detroit, MI, Chicago, IL, New York, NY, Los Angeles, CA, Miami, FL, or Traverse City, MI` 
        })
      }

      ({ lat, lng } = geocodingData.results[0].geometry.location)
      console.log(`Geocoded coordinates for ${fullLocation}: ${lat}, ${lng}`)
    }

    // Convert miles to meters
    const radiusMeters = Math.round(Number(radiusMiles) * 1609)

    // Parse categories (can be comma-separated string or array)
    const selectedCategories = Array.isArray(categories) 
      ? categories 
      : (categories as string).split(',').map(c => c.trim())

    // Step 2: Search for each category
    const allBusinesses: Business[] = []
    let totalSearched = 0
    const debugInfo: any[] = []

    console.log('Starting search loop for categories:', selectedCategories)
    console.log('Loop will run', selectedCategories.length, 'times')
    
    for (const category of selectedCategories) {
      const debugEntry: any = { category, step: 'start' }
      console.log(`Loop iteration: processing category "${category}"`)
      const googleTypes = SERVICE_CATEGORIES[category as keyof typeof SERVICE_CATEGORIES]
      console.log(`Processing category: ${category} -> ${googleTypes}`)
      
      debugEntry.googleTypes = googleTypes
      
      if (!googleTypes || googleTypes.length === 0) {
        console.log(`Skipping unknown category: ${category}`)
        debugEntry.step = 'skipped - unknown category'
        debugInfo.push(debugEntry)
        continue
      }

      // Search each Google type for this category
      for (const googleType of googleTypes) {
        console.log(`Searching for ${category} (${googleType}) in ${city} (${lat}, ${lng}) with radius ${radiusMeters}m`)
        const placesUrl = 'https://places.googleapis.com/v1/places:searchNearby'
        
        debugEntry.step = `making API call for ${googleType}`
        
        const placesResponse = await fetch(placesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.rating,places.location,places.types'
          },
          body: JSON.stringify({
            includedTypes: [googleType],
            maxResultCount: 20,
            locationRestriction: {
              circle: {
                center: {
                  latitude: lat,
                  longitude: lng
                },
                radius: radiusMeters
              }
            }
          })
        })

        if (!placesResponse.ok) {
          const errorText = await placesResponse.text()
          console.error(`Places API error for ${category} (${googleType}):`, errorText)
          debugEntry.step = `API error for ${googleType}`
          debugEntry.error = errorText
          continue
        }

        const placesData: PlacesResult = await placesResponse.json()
        console.log(`Found ${placesData.places?.length || 0} places for ${category} (${googleType})`)
        totalSearched += placesData.places?.length || 0
        
        debugEntry.step = `API success for ${googleType}`
        debugEntry.placesFound = (debugEntry.placesFound || 0) + (placesData.places?.length || 0)
        debugEntry.places = [...(debugEntry.places || []), ...(placesData.places?.map(p => ({ name: p.displayName.text, hasWebsite: !!p.websiteUri })) || [])]
        
        // Add to debug info
        console.log(`Category ${category} (${googleType}): ${placesData.places?.length || 0} places found`)

        // Step 3: Filter for service businesses without websites
        const typeBusinesses = placesData.places
          ?.filter(place => {
            // Must not have a website
            if (place.websiteUri) return false
            
            const name = place.displayName?.text?.toLowerCase() || ''
            const types = place.types?.join(' ').toLowerCase() || ''
            const searchText = `${name} ${types}`
            
            // Much more inclusive filtering - include if:
            // 1. Name contains any service keyword
            // 2. Has service-related Google types
            // 3. Contains common business suffixes
            const hasServiceKeyword = SERVICE_KEYWORDS.some(keyword => searchText.includes(keyword))
            const hasServiceType = types.includes('electrician') || types.includes('plumber') || 
                                  types.includes('painter') || types.includes('car_repair') ||
                                  types.includes('establishment') || types.includes('point_of_interest')
            const hasBusinessSuffix = name.includes('llc') || name.includes('inc') || 
                                    name.includes('corp') || name.includes('company') ||
                                    name.includes('services') || name.includes('service')
            
            return hasServiceKeyword || hasServiceType || hasBusinessSuffix
          })
          ?.map(place => ({
            name: place.displayName.text,
            phone: place.nationalPhoneNumber,
            address: place.formattedAddress,
            rating: place.rating,
            lat: place.location.latitude,
            lng: place.location.longitude,
            type: category
          })) || []

        allBusinesses.push(...typeBusinesses)
      }
      
      debugEntry.filteredBusinesses = allBusinesses.filter(b => b.type === category).length
      debugInfo.push(debugEntry)
    }

    // Remove duplicates based on name and address
    const uniqueBusinesses = allBusinesses.filter((business, index, self) => 
      index === self.findIndex(b => 
        b.name === business.name && b.address === business.address
      )
    )

    res.status(200).json({
      businesses: uniqueBusinesses,
      summary: {
        totalSearched,
        withoutWebsites: uniqueBusinesses.length,
        city,
        state,
        location: fullLocation,
        radiusMiles: Number(radiusMiles),
        categories: selectedCategories
      },
      debug: {
        selectedCategories,
        totalSearched,
        allBusinessesCount: allBusinesses.length,
        uniqueBusinessesCount: uniqueBusinesses.length,
        coordinates: { lat, lng },
        radiusMeters,
        locationKey: (city as string).toLowerCase().trim()
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
