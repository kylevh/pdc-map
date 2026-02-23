import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getDatasetById } from '@/lib/seattle-data'
import { transformGeoJSON } from '@/lib/coordinate-transform'
import { GeoJSONData } from '@/types/geojson'

/**
 * API route to fetch GeoJSON data
 * Handles both local files and remote URLs
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const datasetId = searchParams.get('datasetId')

  if (!datasetId) {
    return NextResponse.json(
      { error: 'datasetId parameter is required' },
      { status: 400 }
    )
  }

  const dataset = getDatasetById(datasetId)
  if (!dataset) {
    return NextResponse.json(
      { error: `Dataset ${datasetId} not found` },
      { status: 404 }
    )
  }

  try {
    let data: GeoJSONData & { crs?: { properties?: { name?: string } } }

    // Check if using local file or remote URL
    if (dataset.filePath) {
      // Read from local file
      try {
        const filePath = join(process.cwd(), dataset.filePath)
        const fileContents = await readFile(filePath, 'utf-8')
        data = JSON.parse(fileContents)
        
        // Check if data needs coordinate transformation
        let needsTransformation = false
        
        if (data.crs && data.crs.properties && data.crs.properties.name) {
          const crsName = data.crs.properties.name
          if (crsName.includes('2926') || crsName.includes('EPSG:2926')) {
            needsTransformation = true
          }
        }
        
        // Fallback: detect State Plane coordinates by size
        if (!needsTransformation && data.features && data.features.length > 0) {
          const firstFeature = data.features[0]
          if (firstFeature.geometry && firstFeature.geometry.coordinates) {
            const coords = firstFeature.geometry.coordinates
            let firstCoord: number | number[] | number[][] | number[][][] | number[][][][] = coords
            while (Array.isArray(firstCoord) && firstCoord.length > 0 && typeof firstCoord[0] !== 'number') {
              firstCoord = firstCoord[0]
            }
            
            if (Array.isArray(firstCoord) && firstCoord.length >= 2 && typeof firstCoord[0] === 'number' && typeof firstCoord[1] === 'number') {
              const [x, y] = firstCoord
              if (Math.abs(x) > 100000 || Math.abs(y) > 100000) {
                needsTransformation = true
              }
            }
          }
        }
        
        if (needsTransformation) {
          console.log(`[API] Transforming coordinates for ${datasetId} from EPSG:2926 to EPSG:4326`)
          data = transformGeoJSON(data, 'EPSG:2926', 'EPSG:4326')
          // Remove CRS property as it's not standard in GeoJSON (coordinates are now in WGS84)
          delete data.crs
        }
      } catch (error) {
        console.error(`[API] Failed to read local file for ${datasetId}:`, error)
        return NextResponse.json(
          { 
            error: `Failed to read local file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            filePath: dataset.filePath,
            hint: 'Check that the file exists at the specified path',
          },
          { status: 500 }
        )
      }
    } else if (dataset.url) {
      const url = dataset.url
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Seattle-GIS-App/1.0',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        return NextResponse.json(
          { 
            error: `Failed to fetch data: ${response.statusText}`,
            url,
          },
          { status: response.status }
        )
      }

      data = await response.json()
    } else {
      return NextResponse.json(
        { 
          error: 'Dataset has neither URL nor filePath configured',
          hint: 'Add either a url or filePath to this dataset in lib/seattle-data.ts',
        },
        { status: 400 }
      )
    }

    // Validate GeoJSON
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      const dataSize = JSON.stringify(data).length
      const shouldCache = dataSize < 2 * 1024 * 1024
      
      console.log(`[API] Returning ${datasetId}: ${data.features.length} features, ${(dataSize / 1024).toFixed(2)}KB`)

      return NextResponse.json(data, {
        headers: shouldCache
          ? {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
          : {
              'Cache-Control': 'no-store',
            },
      })
    }

    return NextResponse.json(
      { error: 'Invalid GeoJSON structure' },
      { status: 500 }
    )
  } catch (error) {
    console.error(`Error fetching Seattle dataset ${datasetId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
