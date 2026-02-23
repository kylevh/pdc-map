import { GeoJSONData } from '@/types/geojson'

export interface SeattleDataset {
  id: string
  name: string
  description: string
  url?: string
  filePath?: string
  color: string
  defaultVisible: boolean
  category: 'zoning' | 'other'
  heatmapWeight?: string
  colorProperty?: string // Property name to use for data-driven coloring
  useDataDrivenColors?: boolean // Whether to use property-based colors instead of single color
}

export const SEATTLE_DATASETS: SeattleDataset[] = [
  {
    id: 'zoning',
    name: 'Zoning Districts',
    description: 'Seattle zoning districts and land use designations',
    filePath: 'public/data/zoning.geojson',
    color: '#3b82f6',
    defaultVisible: false,
    category: 'zoning',
    colorProperty: 'BASE_ZONE', // Use BASE_ZONE for color mapping
    useDataDrivenColors: true,
  },
  {
    id: 'trees',
    name: 'Trees',
    description: 'Seattle trees',
    url: 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/SDOT_Trees_CDL/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson',
    color: '#10b981',
    defaultVisible: false,
    category: 'other',
  },
  {
    id: 'curb-ramps',
    name: 'Curb Ramps',
    description: 'Seattle curb ramps',
    url: 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Curb_Ramps_CDL/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson',
    color: '#10b981',
    defaultVisible: true,
    category: 'other',
  },
  {
    id: 'one-way-streets',
    name: 'One-Way Streets',
    description: 'Seattle one-way streets',
    url: 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/One_Way_Streets_CDL/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson',
    color: '#10b981',
    defaultVisible: true,
    category: 'other',
  },
]

export async function fetchSeattleGeoJSON(
  datasetId: string
): Promise<GeoJSONData | null> {
  try {
    const url = `/api/seattle-data?datasetId=${datasetId}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch dataset ${datasetId}: ${response.statusText}`)
      return null
    }

    const data: GeoJSONData = await response.json()
    
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      return data
    }

    console.error(`Invalid GeoJSON structure for dataset ${datasetId}`)
    return null
  } catch (error) {
    console.error(`Error fetching dataset ${datasetId}:`, error)
    return null
  }
}

export function getDatasetById(id: string): SeattleDataset | undefined {
  return SEATTLE_DATASETS.find((d) => d.id === id)
}
