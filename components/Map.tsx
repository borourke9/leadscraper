import { useEffect, useRef, useState } from 'react'

interface Business {
  name: string
  phone?: string
  address: string
  rating?: number
  lat: number
  lng: number
  type: string
}

interface MapProps {
  businesses: Business[]
  center?: { lat: number; lng: number }
  searchRadius?: number // in miles
}

declare global {
  interface Window {
    google: any
  }
}

export default function Map({ businesses, center, searchRadius }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [searchCircle, setSearchCircle] = useState<any>(null)
  const [centerMarker, setCenterMarker] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeMap = () => {
      if (typeof window === 'undefined' || !window.google || !mapRef.current || map) {
        return
      }

      try {
        const defaultCenter = center || { lat: 44.7631, lng: -85.6206 } // Traverse City, MI
        
        // Ensure the map container has proper dimensions
        if (mapRef.current.offsetWidth === 0 || mapRef.current.offsetHeight === 0) {
          console.log('Map container has no dimensions, retrying...', {
            width: mapRef.current.offsetWidth,
            height: mapRef.current.offsetHeight,
            clientWidth: mapRef.current.clientWidth,
            clientHeight: mapRef.current.clientHeight
          })
          setTimeout(initializeMap, 100)
          return
        }
        
        console.log('Initializing map with dimensions:', {
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        })
        
        const newMap = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: defaultCenter,
          gestureHandling: 'greedy', // Better mobile touch handling
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          clickableIcons: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })
        
        setMap(newMap)
        setIsLoading(false)
        setError(null)
        
        // Trigger resize for mobile devices
        setTimeout(() => {
          if (newMap) {
            window.google.maps.event.trigger(newMap, 'resize')
          }
        }, 100)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    // Check if Google Maps is loaded
    if (window.google) {
      initializeMap()
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = () => {
        if (window.google) {
          initializeMap()
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      
      // Also listen for the callback
      if (typeof window !== 'undefined') {
        window.initMap = initializeMap
      }
      
      checkGoogleMaps()
    }
  }, [center, map])

  // Update search area and center marker when center or radius changes
  useEffect(() => {
    if (map && center) {
      // Clear existing search circle and center marker
      if (searchCircle) searchCircle.setMap(null)
      if (centerMarker) centerMarker.setMap(null)

      // Add center marker
      const newCenterMarker = new window.google.maps.Marker({
        position: center,
        map: map,
        title: 'Search Center',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      })
      setCenterMarker(newCenterMarker)

      // Add search radius circle
      if (searchRadius) {
        const newSearchCircle = new window.google.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          map: map,
          center: center,
          radius: searchRadius * 1609.34 // Convert miles to meters
        })
        setSearchCircle(newSearchCircle)

        // Fit map to show the search area
        const bounds = newSearchCircle.getBounds()
        map.fitBounds(bounds)
      } else {
        // Just center on the location
        map.setCenter(center)
        map.setZoom(12)
      }
    }
  }, [map, center, searchRadius])

  useEffect(() => {
    if (map && businesses.length > 0) {
      // Clear existing business markers
      markers.forEach(marker => marker.setMap(null))
      
      const newMarkers = businesses.map(business => {
        const marker = new window.google.maps.Marker({
          position: { lat: business.lat, lng: business.lng },
          map: map,
          title: business.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 6,
            fillColor: '#FF6B6B',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        })

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-base leading-tight mb-2">${business.name}</h3>
              <p class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mb-2">${business.type}</p>
              <p class="text-xs text-gray-600 mb-2 leading-relaxed">${business.address}</p>
              ${business.phone ? `<p class="text-xs text-gray-600 mb-1">📞 <a href="tel:${business.phone}" class="text-blue-600 hover:underline">${business.phone}</a></p>` : ''}
              ${business.rating ? `<p class="text-xs text-yellow-600 mb-1">⭐ ${business.rating.toFixed(1)}</p>` : ''}
              <p class="text-xs text-red-600 font-medium">🚫 No Website</p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })

        return marker
      })

      setMarkers(newMarkers)
    }
  }, [map, businesses])

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
          <div className="text-center p-4">
            <div className="text-red-500 text-4xl mb-2">🗺️</div>
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className={`w-full h-full rounded-lg shadow-lg mobile-map-container ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
        style={{ minHeight: '200px', height: '100%', width: '100%' }}
      />
    </div>
  )
}
