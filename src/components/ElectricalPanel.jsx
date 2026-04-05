import { useMemo } from 'react'
import { computeRoomLuxStats } from '../utils/luxCalculator'

export default function ElectricalPanel({ fixtures = [], ceilingHeight = 2700, targetLux = 300, reflectances = null, roomGeom = null }) {
  const totalPower     = fixtures.reduce((sum, f) => sum + (f.wattage || f.power || 0), 0)

  const luxStats = useMemo(
    () => computeRoomLuxStats(fixtures, ceilingHeight, { reflectances, roomGeom }),
    [fixtures, ceilingHeight, reflectances, roomGeom]
  )
  const daliFixtures   = fixtures.filter((f) => f.daliAddress)
  const unassigned     = fixtures.filter((f) => !f.daliAddress && (!f.protocol || f.protocol.startsWith('DALI')))

  // Protocol breakdown
  const protocolMap = {}
  fixtures.forEach((f) => {
    const p = f.protocol || 'Unknown'
    protocolMap[p] = (protocolMap[p] || 0) + 1
  })
  const protocolEntries = Object.entries(protocolMap).sort((a, b) => b[1] - a[1])

  // DALI DT6 / DT8 assigned addresses
  const dt6Assigned = fixtures.filter((f) => f.protocol === 'DALI DT6' && f.daliAddress)
  const dt8Assigned = fixtures.filter((f) => f.protocol === 'DALI DT8' && f.daliAddress)

  const mono = { fontFamily: 'IBM Plex Mono, monospace' }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ ...mono, fontSize: 10, color: '#4a7a96', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ELECTRICAL SUMMARY
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Total power */}
        <div style={{ padding: '10px', background: '#0e1d14', border: '1px solid #1a3828', borderRadius: 3 }}>
          <div style={{ ...mono, fontSize: 9, color: '#4a7a96', marginBottom: 4 }}>TOTAL POWER</div>
          <div style={{ ...mono, fontSize: 16, color: '#3dba74', fontWeight: 600 }}>{totalPower}W</div>
          <div style={{ ...mono, fontSize: 9, color: '#2d4f68', marginTop: 2 }}>
            {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* DALI status */}
        <div style={{ padding: '10px', background: '#0a1520', border: '1px solid #1a2b3c', borderRadius: 3 }}>
          <div style={{ ...mono, fontSize: 9, color: '#4a7a96', marginBottom: 6 }}>DALI STATUS</div>
          <div style={{ ...mono, fontSize: 10, color: '#cdd9e5' }}>
            Assigned: <span style={{ color: '#6ae5ff' }}>{daliFixtures.length}</span>
          </div>
          <div style={{ ...mono, fontSize: 10, color: '#cdd9e5', marginTop: 3 }}>
            Unassigned: <span style={{ color: '#e8a245' }}>{unassigned.length}</span>
          </div>
          {dt6Assigned.length > 0 && (
            <div style={{ ...mono, fontSize: 9, color: '#2d4f68', marginTop: 4 }}>
              DT6 addresses: {dt6Assigned.map((f) => f.daliAddress).join(', ')}
            </div>
          )}
          {dt8Assigned.length > 0 && (
            <div style={{ ...mono, fontSize: 9, color: '#2d4f68', marginTop: 2 }}>
              DT8 addresses: {dt8Assigned.map((f) => f.daliAddress).join(', ')}
            </div>
          )}
        </div>

        {/* Protocol breakdown */}
        {protocolEntries.length > 0 && (
          <div style={{ padding: '10px', background: '#0a1520', border: '1px solid #1a2b3c', borderRadius: 3 }}>
            <div style={{ ...mono, fontSize: 9, color: '#4a7a96', marginBottom: 6 }}>PROTOCOLS IN USE</div>
            {protocolEntries.map(([proto, count]) => (
              <div key={proto} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ ...mono, fontSize: 9, color: '#4a7a96' }}>{proto}</span>
                <span
                  style={{
                    ...mono,
                    fontSize: 9,
                    color: '#0f0f0f',
                    background: proto.startsWith('DALI') ? '#6ae5ff' :
                                proto === 'ZIGBEE CCT' ? '#a78bfa' :
                                proto === 'WIFI CCT'  ? '#34d399' :
                                proto === 'RF'        ? '#fb923c' :
                                proto === 'BLE'       ? '#60a5fa' :
                                proto === 'PHASECUT'  ? '#f59e0b' :
                                proto === '0-10V'     ? '#4ade80' :
                                '#94a3b8',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Room lux statistics */}
        {luxStats && (
          <div style={{ padding: '10px', background: '#0a1410', border: '1px solid #1a3828', borderRadius: 3 }}>
            <div style={{ ...mono, fontSize: 9, color: '#3dba74', marginBottom: 8 }}>
              ROOM LUX STATS  <span style={{ color: '#2d4f68' }}>H={ceilingHeight}mm</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {[
                { label: 'AVG',         value: `${luxStats.avg} lx`,       color: '#3dba74' },
                { label: 'MAX',         value: `${luxStats.max} lx`,       color: '#d4a843' },
                { label: 'MIN',         value: `${luxStats.min} lx`,       color: '#4a7a96' },
                { label: 'UNIFORMITY', value: luxStats.uniformity,         color: luxStats.uniformity >= 0.4 ? '#3dba74' : '#e8a245' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginBottom: 1 }}>{label}</div>
                  <div style={{ ...mono, fontSize: 12, color, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ ...mono, fontSize: 8, color: '#1e3448', marginTop: 6 }}>
              Uniformity ≥ 0.40 = good | ≥ 0.60 = excellent
            </div>
            <div style={{ ...mono, fontSize: 8, color: '#1e3448', marginTop: 6, paddingTop: 4, borderTop: '1px solid #0d1f18', display: 'flex', justifyContent: 'space-between' }}>
              <span>Target: <span style={{ color: '#4a7a96' }}>{targetLux} lx</span></span>
              <span style={{ color: luxStats.avg >= targetLux ? '#3dba74' : '#e8a245' }}>
                {luxStats.avg >= targetLux ? '✓ MET' : '✗ BELOW'}
              </span>
            </div>
          </div>
        )}

        {/* Fixture list */}
        {fixtures.length > 0 && (
          <div style={{ borderTop: '1px solid #1a2b3c', paddingTop: 8 }}>
            <div style={{ ...mono, fontSize: 9, color: '#4a7a96', marginBottom: 6 }}>FIXTURE LIST</div>
            {fixtures.map((f, index) => (
              <div
                key={`${f.id}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  marginBottom: 2,
                  background: '#0a0f14',
                  borderRadius: 2,
                  border: '1px solid #131d28',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.shapeSymbol && (
                    <span style={{ fontSize: 11, color: f.wattageColor?.hex || '#e8a245' }}>
                      {f.shapeSymbol}
                    </span>
                  )}
                  <span style={{ ...mono, fontSize: 9, color: '#cdd9e5' }}>{f.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ ...mono, fontSize: 8, color: '#4a7a96' }}>
                    {f.wattage || f.power || 0}W
                  </span>
                  {f.daliAddress && (
                    <span style={{ ...mono, fontSize: 8, color: '#6ae5ff', background: '#0a1e2a', padding: '1px 4px', borderRadius: 2 }}>
                      {f.daliAddress}
                    </span>
                  )}
                  {f.protocol && (
                    <span style={{ ...mono, fontSize: 7, color: '#2d4f68' }}>{f.protocol}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {fixtures.length === 0 && (
          <div style={{ ...mono, fontSize: 9, color: '#2d4f68', textAlign: 'center', padding: '20px 0' }}>
            No fixtures placed yet.
          </div>
        )}
      </div>
    </div>
  )
}
