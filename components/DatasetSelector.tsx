'use client'

import { SeattleDataset } from '@/lib/seattle-data'

interface DatasetSelectorProps {
  availableDatasets: SeattleDataset[]
  selectedDatasets: string[]
  onAddDataset: (datasetId: string) => void
  onRemoveDataset: (datasetId: string) => void
}

export default function DatasetSelector({
  availableDatasets,
  selectedDatasets,
  onAddDataset,
  onRemoveDataset,
}: DatasetSelectorProps) {
  const categories = [
    'zoning',
    'parks',
    'infrastructure',
    'demographics',
    'services',
    'transportation',
    'other',
  ] as const

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      zoning: 'Zoning & Land Use',
      parks: 'Parks & Recreation',
      infrastructure: 'Infrastructure',
      demographics: 'Demographics',
      services: 'City Services',
      transportation: 'Transportation',
      other: 'Other',
    }
    return names[category] || category
  }

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-3">Datasets</h2>
      <p className="text-xs text-gray-600 mb-2">
        Configure datasets in <code className="text-xs bg-gray-100 px-1 rounded">lib/seattle-data.ts</code>
      </p>
      {selectedDatasets.length === 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>No layers loaded.</strong> Click "Add" on any dataset below to start visualizing data.
        </div>
      )}

      {categories.map((category) => {
        const categoryDatasets = availableDatasets.filter((d) => d.category === category)
        if (categoryDatasets.length === 0) return null

        return (
          <div key={category} className="mb-4 last:mb-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {getCategoryName(category)}
            </h3>
            <div className="space-y-2">
              {categoryDatasets.map((dataset) => {
                const isSelected = selectedDatasets.includes(dataset.id)
                return (
                  <div
                    key={dataset.id}
                    className="flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: dataset.color }}
                        ></div>
                        <span className="text-sm font-medium">{dataset.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{dataset.description}</p>
                    </div>
                    {isSelected ? (
                      <button
                        onClick={() => onRemoveDataset(dataset.id)}
                        className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => onAddDataset(dataset.id)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
