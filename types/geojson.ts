export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString'
    coordinates: number[] | number[][] | number[][][] | number[][][][]
  }
  properties: Record<string, any>
}

export interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color?: string
  opacity?: number
  filePath?: string
  data?: GeoJSONData
  colorProperty?: string // Property name to use for data-driven coloring
  useDataDrivenColors?: boolean // Whether to use property-based colors
}
