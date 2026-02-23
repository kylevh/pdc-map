'use client'

import { LayerConfig } from '@/types/geojson'

interface LayerControlProps {
  layers: LayerConfig[]
  onToggleLayer: (layerId: string) => void
  onUpdateLayerColor: (layerId: string, color: string) => void
  onUpdateLayerOpacity: (layerId: string, opacity: number) => void
}

export default function LayerControl({
  layers,
  onToggleLayer,
  onUpdateLayerColor,
  onUpdateLayerOpacity,
}: LayerControlProps) {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Layers</h2>
      <div className="space-y-3">
        {layers.map((layer) => (
          <div key={layer.id} className="border-b pb-3 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => onToggleLayer(layer.id)}
                  className="w-4 h-4"
                />
                <span className="font-medium">{layer.name}</span>
              </label>
            </div>
            {layer.visible && (
              <div className="ml-6 space-y-2">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={layer.color || '#3b82f6'}
                    onChange={(e) => onUpdateLayerColor(layer.id, e.target.value)}
                    className="w-full h-8 rounded border"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Opacity: {Math.round((layer.opacity ?? 0.6) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity ?? 0.6}
                    onChange={(e) =>
                      onUpdateLayerOpacity(layer.id, parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
