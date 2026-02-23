'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Map, { Source, Layer, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GeoJSONData, LayerConfig } from '@/types/geojson'
import { extractHeatmapPoints, generateHeatmapData } from '@/lib/heatmap'

// Generate color mapping for zoning types
function getZoningColorMap(): Record<string, string> {
  // Color scheme for different zoning categories
  const colors: Record<string, string> = {
    // Residential
    'LR1': '#e3f2fd', // Light blue
    'LR2': '#90caf9', // Blue
    'LR3': '#42a5f5', // Medium blue
    'MR': '#1e88e5', // Darker blue
    'HR': '#1565c0', // Dark blue
    'NC1': '#c8e6c9', // Light green
    'NC2': '#81c784', // Green
    'NC3': '#4caf50', // Medium green
    'SF': '#fff9c4', // Light yellow
    'RSL': '#fff59d', // Yellow
    
    // Commercial
    'NC': '#ffccbc', // Light orange
    'C1': '#ffab91', // Orange
    'C2': '#ff7043', // Medium orange
    'DMR': '#f48fb1', // Pink
    
    // Industrial
    'IG1': '#b0bec5', // Light gray
    'IG2': '#78909c', // Gray
    'IC': '#546e7a', // Dark gray
    
    // Mixed use
    'SM': '#ce93d8', // Light purple
    'PM': '#ba68c8', // Purple
    
    // Default fallback
    'default': '#9e9e9e', // Gray
  }
  return colors
}

// Get color for a property value
function getColorForProperty(
  propertyValue: string | null | undefined,
  colorProperty: string,
  defaultColor: string
): string {
  if (!propertyValue) return defaultColor
  
  const colorMap = getZoningColorMap()
  return colorMap[propertyValue] || colorMap[propertyValue.split(' ')[0]] || defaultColor
}

// Check if features have color properties (like fill, stroke, color, etc.)
function hasColorProperty(data: GeoJSONData): string | null {
  if (!data.features || data.features.length === 0) return null
  
  const firstFeature = data.features[0]
  if (!firstFeature.properties) return null
  
  // Check for common color property names
  const colorProps = ['fill', 'fillColor', 'stroke', 'strokeColor', 'color', 'marker-color']
  for (const prop of colorProps) {
    if (firstFeature.properties[prop]) {
      return prop
    }
  }
  
  return null
}

// Generate MapLibre expression for data-driven colors
function getDataDrivenColorExpression(
  colorProperty: string,
  defaultColor: string
): string | (string | string[])[] {
  const colorMap = getZoningColorMap()
  
  // Build match expression
  const matchCases: (string | string[])[] = []
  Object.entries(colorMap).forEach(([key, color]) => {
    if (key !== 'default') {
      matchCases.push(key, color)
    }
  })
  matchCases.push(defaultColor) // Default fallback
  
  return [
    'match',
    ['get', colorProperty],
    ...matchCases,
  ] as (string | string[])[]
}

interface MapComponentProps {
  layers: LayerConfig[]
  showHeatmap: boolean
  heatmapIntensity?: number
  heatmapRadius?: number
  heatmapWeightProperty?: string
}

export default function MapComponent({
  layers,
  showHeatmap,
  heatmapIntensity = 1,
  heatmapRadius = 20,
  heatmapWeightProperty,
}: MapComponentProps) {
  const [popupInfo, setPopupInfo] = useState<{
    lng: number
    lat: number
    properties: Record<string, any>
  } | null>(null)

  // Seattle default view
  const [viewState, setViewState] = useState({
    longitude: -122.3321,
    latitude: 47.6062,
    zoom: 11,
  })
  

  // Collect all GeoJSON data for heatmap
  const heatmapData = useMemo(() => {
    if (!showHeatmap) return null

    const allPoints: Array<{ lat: number; lng: number; weight: number }> = []
    
    layers.forEach((layer) => {
      if (layer.visible && layer.data) {
        const points = extractHeatmapPoints(layer.data, heatmapWeightProperty)
        allPoints.push(...points)
      }
    })

    if (allPoints.length === 0) return null

    return generateHeatmapData(allPoints)
  }, [layers, showHeatmap, heatmapWeightProperty])

  // Debug: Log layer state changes
  useEffect(() => {
    layers.forEach((layer) => {
      if (layer.visible && layer.data) {
        console.log(`[Map] Layer ${layer.id} (${layer.name}):`, {
          features: layer.data.features?.length || 0,
          type: layer.data.type,
          firstGeometryType: layer.data.features?.[0]?.geometry?.type,
        })
      }
    })
  }, [layers])

  // Filter properties to show only the most important ones
  const getImportantProperties = useCallback((properties: Record<string, any>) => {
    // Define important property keys (in order of importance)
    const importantKeys = [
      'ZONING',
      'BASE_ZONE',
      'ZONING_DESC',
      'CATEGORY_DESC',
      'CLASS_DESC',
      'MHA',
      'MHA_VALUE',
      'EFFECTIVE',
      'PUBLIC_DESCRIPTION',
    ]
    
    const filtered: Record<string, any> = {}
    
    // Add important properties that have values
    importantKeys.forEach(key => {
      const value = properties[key]
      if (value !== null && value !== undefined && value !== '' && value !== ' ') {
        filtered[key] = value
      }
    })
    
    return filtered
  }, [])

  const onMapClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (feature && feature.properties) {
      const importantProps = getImportantProperties(feature.properties)
      setPopupInfo({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
        properties: importantProps,
      })
    } else {
      setPopupInfo(null)
    }
  }, [getImportantProperties])

  return (
    <div className="w-full h-screen relative">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={layers
          .filter((l) => l.visible && l.data)
          .map((l) => `layer-${l.id}`)}
        onClick={onMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        {layers.map((layer) => {
          if (!layer.visible || !layer.data) return null

          // Validate that we have features
          if (!layer.data.features || layer.data.features.length === 0) {
            console.warn(`Layer ${layer.id} has no features`)
            return null
          }

          const defaultColor = layer.color || '#3b82f6'
          const opacity = layer.opacity ?? 0.6
          
          // Check if GeoJSON has original color properties
          const originalColorProp = hasColorProperty(layer.data)
          
          // Use original colors if available, otherwise use data-driven or single color
          const useDataDriven = originalColorProp
            ? false // Use original colors from GeoJSON
            : (layer.useDataDrivenColors && layer.colorProperty)

          // Find first feature with valid geometry
          const firstFeature = layer.data.features.find(
            (f) => f.geometry && f.geometry.type
          )
          
          if (!firstFeature) {
            console.warn(`Layer ${layer.id} has no features with valid geometry`)
            return null
          }

          const geometryType = firstFeature.geometry.type
          
          let layerType: 'fill' | 'circle' | 'line' = 'fill'
          if (geometryType === 'Point' || geometryType === 'MultiPoint') {
            layerType = 'circle'
          } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            layerType = 'line'
          }
          // Polygon and MultiPolygon default to 'fill' which is already set

          const sourceId = `source-${layer.id}`
          
          // Determine fill color expression
          // Priority: 1) Original GeoJSON color property, 2) Data-driven by property, 3) Single color
          const fillColor: string | any = originalColorProp
            ? ['get', originalColorProp] // Use original color from GeoJSON
            : (useDataDriven && layer.colorProperty
              ? getDataDrivenColorExpression(layer.colorProperty, defaultColor)
              : defaultColor)

          // For outline, check for stroke/strokeColor, otherwise use fill color
          const strokeColorProp = originalColorProp || 
            (layer.data.features[0]?.properties?.['stroke'] ? 'stroke' : null) ||
            (layer.data.features[0]?.properties?.['strokeColor'] ? 'strokeColor' : null)
          
          const outlineColor: string | any = strokeColorProp
            ? ['get', strokeColorProp]
            : (useDataDriven && layer.colorProperty
              ? getDataDrivenColorExpression(layer.colorProperty, defaultColor)
              : defaultColor)

          return (
            <Source
              key={layer.id}
              id={sourceId}
              type="geojson"
              data={layer.data}
            >
              {layerType === 'fill' && (
                <>
                  <Layer
                    id={`layer-${layer.id}`}
                    type="fill"
                    source={sourceId}
                    paint={{
                      'fill-color': fillColor as any,
                      'fill-opacity': opacity,
                    }}
                  />
                  <Layer
                    id={`layer-${layer.id}-outline`}
                    type="line"
                    source={sourceId}
                    paint={{
                      'line-color': outlineColor as any,
                      'line-opacity': Math.min(opacity + 0.2, 1),
                      'line-width': 1.5,
                    }}
                  />
                </>
              )}
              {layerType === 'circle' && (
                <Layer
                  id={`layer-${layer.id}`}
                  type="circle"
                  source={sourceId}
                  paint={{
                    'circle-color': (useDataDriven && layer.colorProperty
                      ? getDataDrivenColorExpression(layer.colorProperty, defaultColor)
                      : defaultColor) as any,
                    'circle-opacity': opacity,
                    'circle-radius': 5,
                  }}
                />
              )}
              {layerType === 'line' && (
                <Layer
                  id={`layer-${layer.id}`}
                  type="line"
                  source={sourceId}
                  paint={{
                    'line-color': (useDataDriven && layer.colorProperty
                      ? getDataDrivenColorExpression(layer.colorProperty, defaultColor)
                      : defaultColor) as any,
                    'line-opacity': opacity,
                    'line-width': 2,
                  }}
                />
              )}
            </Source>
          )
        })}

        {/* Heatmap layer */}
        {showHeatmap && heatmapData && (
          <Source
            id="heatmap-source"
            type="geojson"
            data={heatmapData}
          >
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                'heatmap-weight': [
                  'interpolate',
                  ['linear'],
                  ['get', 'weight'],
                  0,
                  0,
                  1,
                  1,
                ],
                'heatmap-intensity': heatmapIntensity,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(33, 102, 172, 0)',
                  0.2,
                  'rgb(103, 169, 207)',
                  0.4,
                  'rgb(209, 229, 240)',
                  0.6,
                  'rgb(253, 219, 199)',
                  0.8,
                  'rgb(239, 138, 98)',
                  1,
                  'rgb(178, 24, 43)',
                ],
                'heatmap-radius': heatmapRadius,
                'heatmap-opacity': 0.7,
              }}
            />
          </Source>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            offset={[0, -10]}
            maxWidth="300px"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 max-h-[400px] overflow-y-auto">
              <h3 className="font-semibold mb-2 text-base">Zoning Information</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(popupInfo.properties).map(([key, value]) => {
                  // Format key for display (remove underscores, capitalize)
                  const displayKey = key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                  
                  // Format value for display
                  let displayValue = String(value)
                  if (key === 'EFFECTIVE' && displayValue.includes('GMT')) {
                    // Format date more nicely
                    try {
                      const date = new Date(displayValue)
                      displayValue = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    } catch (e) {
                      // Keep original if parsing fails
                    }
                  }
                  
                  return (
                    <div key={key} className="border-b border-gray-200 pb-1 last:border-0">
                      <div className="font-semibold text-gray-700">{displayKey}</div>
                      <div className="text-gray-600 mt-0.5">{displayValue}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Popup>
        )}

        <NavigationControl position="top-left" />
        <FullscreenControl position="top-left" />
      </Map>
    </div>
  )
}
