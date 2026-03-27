# lighting-canvas

Minimal React + Vite + Konva canvas — hardcoded 6m × 4m room.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Stack

- React 18
- Vite 5
- react-konva / konva 9
- IBM Plex fonts (Google Fonts CDN)

## Canvas layout

| Constant      | Value               |
|---------------|---------------------|
| Canvas size   | 1000 × 700 px       |
| Room size     | 6 000 × 4 000 mm    |
| Scale         | auto-fit with margin|
| Grid step     | 500 mm              |
| Layers        | Grid · Room · Annotations |

## File structure

```
src/
  main.jsx                 React entry point
  App.jsx                  Shell: header + canvas area + status bar
  index.css                Global tokens + reset
  components/
    DesignCanvas.jsx        Konva Stage — all room drawing logic
```
