import React, { useState, useMemo } from 'react';
import { CONFIGURABLE_FIXTURES, FIXTURE_CATEGORIES } from '../data/configurable-fixtures.js';
import FixtureConfigurator from './FixtureConfigurator';

// ── Helpers ────────────────────────────────────────────────────────────

const getCategoryColor = (category) => {
  const colors = {
    'DOWNLIGHT': '#ffe9b0',
    'SPOTLIGHT': '#c8d8f8',
    'LINEAR': '#ffe0c0',
    'PANEL': '#d0eaff',
    'TRACK': '#c0d8f8',
    'WALL_WASHER': '#b8e8ff',
    'STEP_LIGHT': '#d0e8d8',
    'UNDER_CABINET': '#a8f0f0',
    'FLOODLIGHT': '#f8a8a8',
    'PENDANT': '#f8d8f0',
    'COVE_LED_STRIP': '#e8d0ff',
    'HIGH_BAY': '#f8d4a0',
    'OUTDOOR': '#c8f0c0',
    'IN_GROUND': '#a8f0a0',
    'SURFACE_MOUNT': '#ffeec0',
    'TRACK_SYSTEM': '#c0d8f8',
    'MAGNETIC_TRACK': '#b8d4f8',
  };
  return colors[category] || '#ffe9b0';
};

const getCategoryLabel = (category) => {
  const labels = {
    'DOWNLIGHT': 'Downlight',
    'SPOTLIGHT': 'Spotlight',
    'LINEAR': 'Linear',
    'PANEL': 'Panel',
    'TRACK': 'Track Light',
    'WALL_WASHER': 'Wall Washer',
    'STEP_LIGHT': 'Step Light',
    'UNDER_CABINET': 'Under-Cabinet',
    'FLOODLIGHT': 'Floodlight',
    'PENDANT': 'Pendant',
    'COVE_LED_STRIP': 'Cove/Strip',
    'HIGH_BAY': 'High Bay',
    'OUTDOOR': 'Outdoor',
    'IN_GROUND': 'In-Ground',
    'SURFACE_MOUNT': 'Surface Mount',
    'TRACK_SYSTEM': 'Track System',
    'MAGNETIC_TRACK': 'Magnetic Track',
  };
  return labels[category] || category.replace(/_/g, ' ');
};

// ── Main Panel ────────────────────────────────────────────────────────────────

export function FixtureLibraryPanel({
  activeFixtureId,
  onSelect,
  userId,
  isProfessional,
  onProfessionalGate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set(Object.keys(FIXTURE_CATEGORIES)));
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);

  const filteredFixtures = useMemo(() => {
    if (!searchQuery) return CONFIGURABLE_FIXTURES;
    return CONFIGURABLE_FIXTURES.filter(fixture =>
      fixture.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const fixturesByCategory = useMemo(() => {
    const grouped = {};
    Object.keys(FIXTURE_CATEGORIES).forEach(cat => {
      grouped[cat] = [];
    });
    filteredFixtures.forEach(fixture => {
      if (fixture.category && grouped[fixture.category]) {
        grouped[fixture.category].push(fixture);
      }
    });
    return grouped;
  }, [filteredFixtures]);

  function toggleCategory(category) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });
  }

  function handleFixtureClick(fixture) {
    setSelectedFixture(fixture);
    setShowConfigurator(true);
  }

  function handleConfiguredFixture(config) {
    onSelect(config);
    setShowConfigurator(false);
    setSelectedFixture(null);
  }

  return (
    <div style={{
      width: '100%', background: '#111111', borderRight: 'none',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a', background: '#111111', flexShrink: 0 }}>
        <div style={{
          fontSize: 9, color: '#555555', letterSpacing: '0.14em',
          fontWeight: 600, marginBottom: 10, textTransform: 'uppercase'
        }}>
          Fixture Library
        </div>

        {/* CONFIG button */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          <button
            onClick={() => { setSelectedFixture(null); setShowConfigurator(true); }}
            style={{
              flex: 0.8, padding: '5px 8px',
              background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: 5,
              color: '#555555',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.03em', transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#444444';
              e.currentTarget.style.color = '#cccccc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a';
              e.currentTarget.style.color = '#555555';
            }}
            title="Build a custom COB downlight"
          >⚙ CONFIG</button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search fixtures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '7px 10px', boxSizing: 'border-box',
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5,
            color: '#cccccc', fontSize: 12, outline: 'none'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#d4a843'; e.currentTarget.style.background = '#1e1e1e'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = '#1a1a1a'; }}
        />
      </div>

      {/* Fixture list by category */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 10px 12px' }}>
        {filteredFixtures.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#999999', fontSize: 12 }}>
            No fixtures found
          </div>
        ) : (
          Object.keys(FIXTURE_CATEGORIES).map(category => {
            const fixtures = fixturesByCategory[category];
            if (fixtures.length === 0) return null;

            return (
              <div key={category} style={{ marginBottom: 12 }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    background: getCategoryColor(category),
                    border: 'none',
                    borderRadius: 4,
                    color: '#0a0a0a',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span>{getCategoryLabel(category)} ({fixtures.length})</span>
                  <span style={{ fontSize: 10 }}>{expandedCategories.has(category) ? '▼' : '▶'}</span>
                </button>

                {/* Fixtures in category */}
                {expandedCategories.has(category) && (
                  <div style={{ paddingLeft: 8, marginTop: 6 }}>
                    {fixtures.map((fixture) => (
                      <button
                        key={fixture.id}
                        onClick={() => handleFixtureClick(fixture)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '6px 8px',
                          marginBottom: 4,
                          background: 'transparent',
                          border: '1px solid #2a2a2a',
                          borderRadius: 3,
                          color: '#cccccc',
                          fontSize: 11,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#1a1a1a';
                          e.currentTarget.style.borderColor = '#d4a843';
                          e.currentTarget.style.color = '#d4a843';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#2a2a2a';
                          e.currentTarget.style.color = '#cccccc';
                        }}
                      >
                        {fixture.icon} {fixture.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d',
        fontSize: 11, color: '#555555', display: 'flex', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <span>{filteredFixtures.length} fixture{filteredFixtures.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Fixture Configurator Modal */}
      {showConfigurator && (
        <FixtureConfigurator
          fixture={selectedFixture}
          onAddFixture={handleConfiguredFixture}
          onClose={() => { setShowConfigurator(false); setSelectedFixture(null); }}
        />
      )}
    </div>
  );
}
