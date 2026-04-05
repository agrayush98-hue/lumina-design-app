export const fixtureTemplates = {
  pendant: {
    name: 'Pendant',
    icon: '💡',
    description: 'Hanging ceiling fixture',
    variants: [
      { name: 'Pendant 30W', power: 30, wattage: 30, beamAngle: 40, lightType: 'LED' },
      { name: 'Pendant 50W', power: 50, wattage: 50, beamAngle: 35, lightType: 'LED' },
      { name: 'Pendant 75W', power: 75, wattage: 75, beamAngle: 30, lightType: 'LED' },
    ],
  },
  track: {
    name: 'Track Light',
    icon: '🔦',
    description: 'Linear track-mounted fixture',
    variants: [
      { name: 'Track 35W', power: 35, wattage: 35, beamAngle: 35, lightType: 'LED' },
      { name: 'Track 50W', power: 50, wattage: 50, beamAngle: 30, lightType: 'LED' },
      { name: 'Track 75W', power: 75, wattage: 75, beamAngle: 25, lightType: 'LED' },
    ],
  },
  downlight: {
    name: 'Downlight',
    icon: '⬇️',
    description: 'Recessed ceiling downlight',
    variants: [
      { name: 'Downlight 15W', power: 15, wattage: 15, beamAngle: 50, lightType: 'LED' },
      { name: 'Downlight 20W', power: 20, wattage: 20, beamAngle: 45, lightType: 'LED' },
      { name: 'Downlight 30W', power: 30, wattage: 30, beamAngle: 40, lightType: 'LED' },
    ],
  },
  sconce: {
    name: 'Wall Sconce',
    icon: '🏮',
    description: 'Wall-mounted fixture',
    variants: [
      { name: 'Sconce 15W', power: 15, wattage: 15, beamAngle: 60, lightType: 'LED' },
      { name: 'Sconce 25W', power: 25, wattage: 25, beamAngle: 55, lightType: 'LED' },
      { name: 'Sconce 40W', power: 40, wattage: 40, beamAngle: 50, lightType: 'LED' },
    ],
  },
  linear: {
    name: 'Linear',
    icon: '━━',
    description: 'Linear bar or strip light',
    variants: [
      { name: 'Linear 50W', power: 50, wattage: 50, beamAngle: 80, lightType: 'LED' },
      { name: 'Linear 75W', power: 75, wattage: 75, beamAngle: 85, lightType: 'LED' },
      { name: 'Linear 100W', power: 100, wattage: 100, beamAngle: 90, lightType: 'LED' },
    ],
  },
  recessed: {
    name: 'Recessed',
    icon: '⭕',
    description: 'In-ceiling recessed fixture',
    variants: [
      { name: 'Recessed 12W', power: 12, wattage: 12, beamAngle: 55, lightType: 'LED' },
      { name: 'Recessed 18W', power: 18, wattage: 18, beamAngle: 50, lightType: 'LED' },
      { name: 'Recessed 25W', power: 25, wattage: 25, beamAngle: 45, lightType: 'LED' },
    ],
  },
}
