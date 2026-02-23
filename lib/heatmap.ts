import { GeoJSONData } from '@/types/geojson'

export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
}

export function extractHeatmapPoints(
  data: GeoJSONData,
  weightProperty?: string
): HeatmapPoint[] {
  const points: HeatmapPoint[] = []

  data.features.forEach((feature) => {
    let lat: number, lng: number
    let weight = 1

    // Extract weight from properties if specified
    if (weightProperty && feature.properties[weightProperty]) {
      weight = parseFloat(feature.properties[weightProperty]) || 1
    }

    // Handle different geometry types
    if (feature.geometry.type === 'Point') {
      const coords = feature.geometry.coordinates as number[]
      lng = coords[0]
      lat = coords[1]
    } else if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates as number[][][]
      // Calculate centroid of polygon
      const polygon = coords[0]
      let sumLat = 0
      let sumLng = 0
      for (const coord of polygon) {
        sumLng += coord[0]
        sumLat += coord[1]
      }
      lng = sumLng / polygon.length
      lat = sumLat / polygon.length
    } else if (feature.geometry.type === 'MultiPolygon') {
      const coords = feature.geometry.coordinates as number[][][][]
      // Use first polygon's centroid
      const polygon = coords[0][0]
      let sumLat = 0
      let sumLng = 0
      for (const coord of polygon) {
        sumLng += coord[0]
        sumLat += coord[1]
      }
      lng = sumLng / polygon.length
      lat = sumLat / polygon.length
    } else {
      return // Skip unsupported geometry types
    }

    points.push({ lat, lng, weight })
  })

  return points
}

export function generateHeatmapData(points: HeatmapPoint[]): GeoJSONData {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        weight: point.weight,
      },
    })),
  }
}
