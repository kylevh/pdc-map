import proj4 from 'proj4'

// EPSG:2926 (Washington State Plane North)
proj4.defs(
  'EPSG:2926',
  '+proj=lcc +lat_1=47.5 +lat_2=48.73333333333333 +lat_0=47 +lon_0=-120.8333333333333 +x_0=500000.0001016001 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs'
)

// WGS84 (web map coordinates)
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs')

function transformCoordinates(coords: any, fromCRS: string, toCRS: string): any {
  if (Array.isArray(coords[0])) {
    // Multi-dimensional array - recurse
    return coords.map((coord: any) => transformCoordinates(coord, fromCRS, toCRS))
  } else {
    // Base case: [x, y] or [x, y, z]
    const [x, y, ...rest] = coords
    const [lon, lat] = proj4(fromCRS, toCRS, [x, y])
    return [lon, lat, ...rest]
  }
}

export function transformGeoJSON(
  geojson: any,
  fromCRS: string = 'EPSG:2926',
  toCRS: string = 'EPSG:4326'
): any {
  if (!geojson || geojson.type !== 'FeatureCollection') {
    throw new Error('Expected a GeoJSON FeatureCollection')
  }

  return {
    type: 'FeatureCollection',
    features: geojson.features.map((feature: any) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        return feature
      }

      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: transformCoordinates(feature.geometry.coordinates, fromCRS, toCRS),
        },
      }
    }),
  }
}
