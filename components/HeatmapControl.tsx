'use client'

interface HeatmapControlProps {
  showHeatmap: boolean
  onToggleHeatmap: () => void
  intensity: number
  radius: number
  onUpdateIntensity: (value: number) => void
  onUpdateRadius: (value: number) => void
}

export default function HeatmapControl({
  showHeatmap,
  onToggleHeatmap,
  intensity,
  radius,
  onUpdateIntensity,
  onUpdateRadius,
}: HeatmapControlProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
      <h2 className="text-lg font-bold mb-4">Heatmap</h2>
      <div className="space-y-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={onToggleHeatmap}
            className="w-4 h-4"
          />
          <span>Show Heatmap</span>
        </label>
        {showHeatmap && (
          <>
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Intensity: {intensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={intensity}
                onChange={(e) => onUpdateIntensity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Radius: {radius}px
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => onUpdateRadius(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
