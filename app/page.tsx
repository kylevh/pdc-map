'use client'

import { useState, useEffect } from 'react'
import MapComponent from '@/components/Map'
import LayerControl from '@/components/LayerControl'
import HeatmapControl from '@/components/HeatmapControl'
import DatasetSelector from '@/components/DatasetSelector'
import DebugPanel from '@/components/DebugPanel'
import { LayerConfig, GeoJSONData } from '@/types/geojson'
import {
  SEATTLE_DATASETS,
  fetchSeattleGeoJSON,
  getDatasetById,
  type SeattleDataset,
} from '@/lib/seattle-data'

export default function Home() {
  const [layers, setLayers] = useState<LayerConfig[]>([])
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState(1)
  const [heatmapRadius, setHeatmapRadius] = useState(20)
  const [loading, setLoading] = useState(false)
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([])

  // Load datasets from Seattle API or local files
  useEffect(() => {
    const loadLayers = async () => {
      // Don't load if no datasets selected
      if (selectedDatasets.length === 0) {
        setLayers([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Load selected datasets
        const datasetsToLoad = selectedDatasets
          .map((id) => getDatasetById(id))
          .filter((d): d is SeattleDataset => d !== undefined)

        const layerPromises = datasetsToLoad.map(async (dataset) => {
          let data: GeoJSONData | null = null

          try {
            data = await fetchSeattleGeoJSON(dataset.id)
          } catch (error) {
            console.error(`Failed to load ${dataset.name}:`, error)
          }

          return {
            id: dataset.id,
            name: dataset.name,
            visible: dataset.defaultVisible,
            color: dataset.color,
            opacity: 0.6,
            data: data || undefined,
            colorProperty: dataset.colorProperty,
            useDataDrivenColors: dataset.useDataDrivenColors,
          } as LayerConfig
        })

        const loadedLayers = await Promise.all(layerPromises)
        setLayers(loadedLayers)
      } catch (error) {
        console.error('Error loading layers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLayers()
  }, [selectedDatasets])

  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    )
  }

  const handleUpdateLayerColor = (layerId: string, color: string) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, color } : layer))
    )
  }

  const handleUpdateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer))
    )
  }

  const handleAddDataset = (datasetId: string) => {
    if (!selectedDatasets.includes(datasetId)) {
      setSelectedDatasets([...selectedDatasets, datasetId])
    }
  }

  const handleRemoveDataset = (datasetId: string) => {
    setSelectedDatasets(selectedDatasets.filter((id) => id !== datasetId))
    // Also remove from layers
    setLayers(layers.filter((layer) => layer.id !== datasetId))
  }

  return (
    <main className="w-full h-screen relative">
      {loading && selectedDatasets.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-6 py-3 z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Loading data...</span>
          </div>
        </div>
      )}
      <MapComponent
        layers={layers}
        showHeatmap={showHeatmap}
        heatmapIntensity={heatmapIntensity}
        heatmapRadius={heatmapRadius}
      />
      <DatasetSelector
        availableDatasets={SEATTLE_DATASETS}
        selectedDatasets={selectedDatasets}
        onAddDataset={handleAddDataset}
        onRemoveDataset={handleRemoveDataset}
      />
      <LayerControl
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onUpdateLayerColor={handleUpdateLayerColor}
        onUpdateLayerOpacity={handleUpdateLayerOpacity}
      />
      <HeatmapControl
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        intensity={heatmapIntensity}
        radius={heatmapRadius}
        onUpdateIntensity={setHeatmapIntensity}
        onUpdateRadius={setHeatmapRadius}
      />
      <DebugPanel layers={layers} showHeatmap={showHeatmap} />
    </main>
  )
}
