export default function FixturePanel({ fixtures = [] }) {
  return (
    <div style={{ padding: '12px' }}>
      <div
        style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          color: '#4a7a96',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {fixtures.length} FIXTURE{fixtures.length !== 1 ? 'S' : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            style={{
              padding: '8px 10px',
              background: '#0d1117',
              border: '1px solid #1a2b3c',
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 10,
                color: '#cdd9e5',
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {fixture.name}
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 9,
                color: '#4a7a96',
                marginBottom: 3,
              }}
            >
              Type: {fixture.type} | {fixture.power}W
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 9,
                color: fixture.daliAddress ? '#6ae5ff' : '#e8a245',
              }}
            >
              {fixture.daliAddress ? `Address: ${fixture.daliAddress}` : 'No DALI'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
