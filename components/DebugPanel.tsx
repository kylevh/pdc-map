'use client'

import { LayerConfig } from '@/types/geojson'

interface DebugPanelProps {
  layers: LayerConfig[]
  showHeatmap: boolean
}

export default function DebugPanel({ layers, showHeatmap }: DebugPanelProps) {
  const layersWithData = layers.filter((l) => l.data)
  const visibleLayers = layers.filter((l) => l.visible && l.data)
  const totalFeatures = layers.reduce((sum, l) => sum + (l.data?.features?.length || 0), 0)
  
  // Check for data issues
  const dataIssues = layers
    .filter((l) => l.data)
    .map((l) => {
      const issues: string[] = []
      if (!l.data?.type || l.data.type !== 'FeatureCollection') {
        issues.push('Invalid type')
      }
      if (!Array.isArray(l.data?.features)) {
        issues.push('No features array')
      }
      if (l.data?.features?.length === 0) {
        issues.push('Empty features')
      }
      if (l.visible && l.data && issues.length === 0) {
        const firstFeature = l.data.features[0]
        if (!firstFeature?.geometry) {
          issues.push('No geometry')
        }
      }
      return { layer: l.name, issues }
    })
    .filter((item) => item.issues.length > 0)

  return (
    <div className="absolute bottom-4 left-4 bg-black/80 text-white rounded-lg p-3 text-xs font-mono z-20 max-w-md">
      <div className="font-bold mb-2 text-yellow-400">🐛 DEBUG INFO</div>
      <div className="space-y-1">
        <div>Total Layers: {layers.length}</div>
        <div>Layers with Data: {layersWithData.length}</div>
        <div>Visible Layers: {visibleLayers.length}</div>
        <div>Total Features: {totalFeatures.toLocaleString()}</div>
        <div>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</div>
        {dataIssues.length > 0 && (
          <div className="mt-2 pt-2 border-t border-red-500/50">
            <div className="font-semibold mb-1 text-red-400">⚠️ Data Issues:</div>
            {dataIssues.map((item, idx) => (
              <div key={idx} className="ml-2 text-xs text-red-300">
                {item.layer}: {item.issues.join(', ')}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="font-semibold mb-1">Layer Details:</div>
          {layers.map((layer) => (
            <div key={layer.id} className="ml-2 text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: layer.visible ? '#10b981' : '#ef4444' }}
                ></div>
                <span className={layer.data ? 'text-green-300' : 'text-red-300'}>
                  {layer.name}
                </span>
              </div>
              {layer.data && (
                <div className="ml-4 text-gray-400">
                  {layer.data.features.length.toLocaleString()} features
                  {layer.data.features[0] && (
                    <span className="ml-2">
                      ({layer.data.features[0].geometry?.type || 'unknown'})
                    </span>
                  )}
                </div>
              )}
              {!layer.data && (
                <div className="ml-4 text-red-400">No data loaded</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
