import { Group, Circle } from 'react-konva'
import { getBeamRadiusPx } from '../utils/luxCalculator'

export default function BeamVisualization({ fixtures = [], ceilingHeight = 2700, roomGeom = null }) {
  const clipX      = roomGeom ? roomGeom.roomX   : 120
  const clipY      = roomGeom ? roomGeom.roomY   : 120
  const clipWidth  = roomGeom ? roomGeom.roomPxW : 720
  const clipHeight = roomGeom ? roomGeom.roomPxH : 480

  return (
    <Group clipX={clipX} clipY={clipY} clipWidth={clipWidth} clipHeight={clipHeight}>
      {fixtures.map((fixture) => {
        const x = fixture.position.x
        const y = fixture.position.y
        const beamAngle = fixture.beamAngle || 60
        const fillColor = fixture.wattageColor?.hex || '#d4a843'
        const r = getBeamRadiusPx(fixture, ceilingHeight)

        if (r === null) {
          return (
            <Group key={fixture.id}>
              <Circle x={x} y={y} radius={40} fill={`${fillColor}10`} stroke={fillColor}
                strokeWidth={1} dash={[4, 6]} opacity={0.5} />
              <Circle x={x} y={y} radius={20} fill={`${fillColor}18`} stroke='transparent' />
            </Group>
          )
        }

        const isNarrow   = beamAngle <= 25
        const strokeOpac = isNarrow ? 0.9 : 0.6
        const fillOpac   = isNarrow ? 0.08 : 0.05

        return (
          <Group key={fixture.id}>
            <Circle x={x} y={y} radius={r}
              fill={`${fillColor}${Math.round(fillOpac * 255).toString(16).padStart(2, '0')}`}
              stroke={fillColor} strokeWidth={1} opacity={strokeOpac}
              dash={beamAngle >= 90 ? [6, 4] : undefined} />
            {r > 18 && (
              <Circle x={x} y={y} radius={r * 0.707} fill='transparent'
                stroke={fillColor} strokeWidth={0.5} opacity={0.3} dash={[3, 4]} />
            )}
            <Circle x={x} y={y} radius={2} fill={fillColor} opacity={0.8} />
          </Group>
        )
      })}
    </Group>
  )
}
