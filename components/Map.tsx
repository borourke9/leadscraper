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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && mapRef.current && !map) {
      const defaultCenter = center || { lat: 44.7631, lng: -85.6206 } // Traverse City, MI
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: defaultCenter,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })
      
      setMap(newMap)
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
            <div class="p-2">
              <h3 class="font-semibold text-lg">${business.name}</h3>
              <p class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mb-2">${business.type}</p>
              <p class="text-sm text-gray-600">${business.address}</p>
              ${business.phone ? `<p class="text-sm text-gray-600">📞 ${business.phone}</p>` : ''}
              ${business.rating ? `<p class="text-sm text-yellow-600">⭐ ${business.rating.toFixed(1)}</p>` : ''}
              <p class="text-xs text-red-600 mt-1">🚫 No Website</p>
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
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />
    </div>
  )
}
