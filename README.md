# Seattle GIS Layers

Interactive map application for visualizing GeoJSON data with heatmaps.

## Features

- Display multiple GeoJSON layers (polygons, points, lines)
- Dynamic heatmap generation
- Customizable layer colors and opacity
- Click features to view properties
- Support for both remote URLs and local GeoJSON files
- Automatic coordinate transformation (State Plane to WGS84)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Adding Datasets

Edit `lib/seattle-data.ts` and add your datasets:

```typescript
{
  id: 'my-dataset',
  name: 'My Dataset',
  description: 'Description',
  url: 'https://...', // or filePath: 'lib/GeoJson/file.geojson'
  color: '#3b82f6',
  defaultVisible: false,
  category: 'other',
}
```

## Tech Stack

- Next.js 14
- TypeScript
- MapLibre GL
- Tailwind CSS
# pdc-map
# pdc-map
