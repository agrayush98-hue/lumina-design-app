import React, { useState, useMemo } from 'react';
import standardFixtures from '../data/complete-fixture-library.json';
import brandedFixtures from '../data/branded-fixture-library.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getBeamColor = (deg) => {
  if (deg <= 24) return '#3b82f6';
  if (deg <= 60) return '#f59e0b';
  return '#10b981';
};

const wattageColor = (w) =>
  !w       ? '#888888' :
  w <= 10  ? '#90EE90' :
  w <= 20  ? '#87CEEB' :
  w <= 40  ? '#FFD700' : '#FF6B6B';

// ── VariantRow ────────────────────────────────────────────────────────────────

function VariantRow({ fixture, variant, onVariantClick }) {
  const beamOptions = variant.beamOptions || fixture.beamOptions || (fixture.beam ? [fixture.beam] : [36]);
  const [selectedBeam, setSelectedBeam] = useState(beamOptions[0] ?? 36);
  const [hovered, setHovered] = useState(false);

  const isStrip = !!variant.watt_per_meter;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#1a1a1a' : '#141414',
        border: '1px solid #2e2e2e',
        borderRadius: 6,
        padding: 10,
        cursor: 'pointer',
        transition: 'background 0.15s ease'
      }}
    >
      {/* Wattage */}
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 14, fontWeight: 700,
        color: wattageColor(variant.watt || variant.watt_per_meter),
        marginBottom: 4
      }}>
        {isStrip
          ? `${variant.watt_per_meter}W/m`
          : variant.watt
            ? `${variant.watt}W`
            : null}
        {variant.size && (
          <span style={{ fontSize: 10, fontWeight: 400, color: '#888888', marginLeft: 6 }}>
            {variant.size}
          </span>
        )}
      </div>

      {/* Lumens + Efficacy */}
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 9, color: '#888888', marginBottom: 8, lineHeight: 1.5
      }}>
        {isStrip
          ? `${variant.lumens_per_meter}lm/m`
          : `${variant.lumens}lm`}
        {variant.efficacy && ` · ${variant.efficacy}lm/W`}
      </div>

      {/* CCT Badge */}
      {variant.cct && (
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8, color: '#888888',
          background: '#0a0a0a', padding: '2px 6px',
          borderRadius: 3, marginBottom: 8,
          display: 'inline-block'
        }}>
          {variant.cct}
        </div>
      )}

      {/* Beam Angle Pills */}
      {beamOptions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {beamOptions.map(beam => {
            const active = selectedBeam === beam;
            return (
              <button
                key={beam}
                onClick={(e) => { e.stopPropagation(); setSelectedBeam(beam); }}
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 9, fontWeight: 600,
                  color: active ? '#000000' : '#d4a843',
                  background: active ? '#d4a843' : 'transparent',
                  border: '1px solid #d4a843',
                  borderRadius: 3, padding: '3px 6px',
                  cursor: 'pointer', transition: 'all 0.15s ease'
                }}
              >
                {beam}°
              </button>
            );
          })}
        </div>
      )}

      {/* Add to Canvas */}
      <button
        onClick={(e) => { e.stopPropagation(); onVariantClick(fixture, variant, selectedBeam); }}
        style={{
          width: '100%', padding: '6px',
          background: '#1a1a1a', border: '1px solid #d4a843', borderRadius: 4,
          color: '#d4a843', fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 9, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.05em', transition: 'background 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#2a2010'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
      >
        + ADD TO CANVAS
      </button>
    </div>
  );
}

// ── FixtureCard ───────────────────────────────────────────────────────────────

function FixtureCard({ fixture, isExpanded, onToggle, onVariantClick }) {
  const wattRange = useMemo(() => {
    const watts = fixture.variants.map(v => v.watt || v.watt_per_meter || 0).filter(w => w > 0);
    if (!watts.length) return null;
    const min = Math.min(...watts), max = Math.max(...watts);
    return min === max ? `${min}W` : `${min}–${max}W`;
  }, [fixture]);

  return (
    <div style={{
      background: '#1a1a1a',
      border: `1px solid ${isExpanded ? '#3a3a3a' : '#2e2e2e'}`,
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease'
    }}>
      {/* Card Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isExpanded ? '#222222' : 'transparent',
          transition: 'background 0.2s ease'
        }}
        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#1f1f1f'; }}
        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 12, fontWeight: 600, color: '#f0f0f0',
            marginBottom: 6, letterSpacing: '0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {fixture.name}
          </div>

          {/* Brand + subcategory + CRI row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {fixture.brand && (
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 9, fontWeight: 600, color: '#d4a843',
                background: '#2a2010', padding: '2px 7px',
                borderRadius: 3, letterSpacing: '0.05em'
              }}>
                {fixture.brand.toUpperCase()}
              </span>
            )}
            {fixture.subcategory && (
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 9, color: '#666666',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {fixture.subcategory}
              </span>
            )}
            {fixture.cri && (
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
                color: fixture.cri >= 90 ? '#90EE90' : fixture.cri >= 80 ? '#87CEEB' : '#888888'
              }}>
                ◆ CRI{fixture.cri}
              </span>
            )}
            {wattRange && (
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#666666' }}>
                ⚡ {wattRange}
              </span>
            )}
          </div>
        </div>

        {/* Count + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#555555'
          }}>
            {fixture.variants.length}v
          </span>
          <span style={{
            fontSize: 12, color: '#555555',
            display: 'inline-block',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▸
          </span>
        </div>
      </div>

      {/* Expanded Variants Grid */}
      {isExpanded && (
        <div style={{
          padding: '8px 12px 12px',
          background: '#0f0f0f',
          borderTop: '1px solid #2e2e2e'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 8,
            marginTop: 4
          }}>
            {fixture.variants.map((variant, idx) => (
              <VariantRow
                key={idx}
                fixture={fixture}
                variant={variant}
                onVariantClick={onVariantClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function FixtureLibraryPanel({
  activeFixtureId,
  onSelect,
  userId,
  isProfessional,
  onProfessionalGate
}) {
  const [libraryTab,     setLibraryTab]     = useState('STANDARD');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedBrand,  setSelectedBrand]  = useState('ALL');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [expandedSet,    setExpandedSet]    = useState(new Set());

  const fixtureData = libraryTab === 'STANDARD' ? standardFixtures : brandedFixtures;

  const categories = useMemo(() => {
    return ['ALL', ...new Set(fixtureData.fixtures.map(f => f.category))];
  }, [fixtureData]);

  const filteredFixtures = useMemo(() => {
    return fixtureData.fixtures.filter(fixture => {
      if (activeCategory !== 'ALL' && fixture.category !== activeCategory) return false;
      if (searchQuery && !fixture.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(fixture.brand && fixture.brand.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (libraryTab === 'BRANDED' && selectedBrand !== 'ALL' && fixture.brand !== selectedBrand) return false;
      return true;
    });
  }, [fixtureData, activeCategory, selectedBrand, searchQuery, libraryTab]);

  function toggleExpanded(key) {
    setExpandedSet(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleVariantClick(fixture, variant, selectedBeam) {
    const categoryMap = {
      'DOWNLIGHT':     'Downlight',
      'SPOTLIGHT':     'Spotlight',
      'PANEL':         'Panel',
      'LINEAR':        'Linear',
      'STRIP':         'LED_STRIP',
      'PENDANT':       'Pendant',
      'ARCHITECTURAL': 'Cove_Light',
      'INDUSTRIAL':    'High_Bay',
      'OUTDOOR':       'Outdoor',
      'EMERGENCY':     'Emergency'
    };

    const category = categoryMap[fixture.category] || fixture.category;
    const beamAngle = selectedBeam ||
      (variant.beamOptions ? variant.beamOptions[0] : fixture.beam) || 36;

    onSelect({
      id: crypto.randomUUID(),
      category,
      subcategory: fixture.subcategory,
      name: fixture.name,
      brand: fixture.brand ?? null,
      watt: variant.watt || variant.watt_per_meter || 10,
      lumens: variant.lumens || variant.lumens_per_meter || 1000,
      beamAngle,
      cri: fixture.cri || 80,
      efficacy: variant.efficacy || 100,
      mounting: fixture.mounting || 'Recessed',
      protocol: 'NON-DIM',
      fixtureShape: 'circle',
      fixtureColor: '#ffe9b0',
      fill: '#ffe9b0',
      stroke: '#ffb300',
      glowColor: 'rgba(255,179,0,0.08)',
      visualRadius: 6,
      ...(variant.watt_per_meter && {
        wattPerMeter: variant.watt_per_meter,
        lumensPerMeter: variant.lumens_per_meter
      }),
      ...(variant.size && { size: variant.size })
    });
  }

  return (
    <div style={{
      width: 240, background: '#0a0a0a', borderRight: '1px solid #222222',
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      fontFamily: 'IBM Plex Mono, monospace'
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2a2a2a', background: '#0f0f0f', flexShrink: 0 }}>
        <div style={{
          fontSize: 11, color: '#666666', letterSpacing: '0.1em',
          fontWeight: 600, marginBottom: 12, textTransform: 'uppercase'
        }}>
          Fixture Library
        </div>

        {/* STANDARD / BRANDED tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {['STANDARD', 'BRANDED'].map(tab => (
            <button
              key={tab}
              onClick={() => { setLibraryTab(tab); setActiveCategory('ALL'); setSelectedBrand('ALL'); setSearchQuery(''); setExpandedSet(new Set()); }}
              style={{
                flex: 1, padding: '6px 10px',
                background: libraryTab === tab ? '#2a2010' : '#141414',
                border: libraryTab === tab ? '1px solid #d4a843' : '1px solid #2a2a2a',
                borderRadius: 4,
                color: libraryTab === tab ? '#d4a843' : '#666666',
                fontSize: 9, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.06em', transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (libraryTab !== tab) {
                  e.currentTarget.style.borderColor = '#3a3a3a';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (libraryTab !== tab) {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#666666';
                }
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search fixtures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '8px 10px', boxSizing: 'border-box',
            background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 4,
            color: '#ffffff', fontSize: 11, outline: 'none', marginBottom: 10
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#d4a843'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '3px 9px',
                background: activeCategory === cat ? '#2a2010' : '#141414',
                border: activeCategory === cat ? '1px solid #d4a843' : '1px solid #2a2a2a',
                borderRadius: 4,
                color: activeCategory === cat ? '#d4a843' : '#666666',
                fontSize: 9, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.04em', transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = '#3a3a3a';
                  e.currentTarget.style.color = '#cccccc';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#666666';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Brand pills — BRANDED tab only */}
        {libraryTab === 'BRANDED' && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              fontSize: 9, fontWeight: 600, color: '#666666',
              letterSpacing: '0.1em', marginBottom: 6
            }}>
              BRANDS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {['ALL', ...Array.from(new Set(fixtureData.fixtures.map(f => f.brand).filter(Boolean)))].map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  style={{
                    padding: '3px 9px',
                    background: selectedBrand === brand ? '#d4a843' : '#141414',
                    border: selectedBrand === brand ? '1px solid #d4a843' : '1px solid #3a3a2a',
                    borderRadius: 4,
                    color: selectedBrand === brand ? '#000000' : '#d4a843',
                    fontSize: 9, fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0.04em', transition: 'all 0.15s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBrand !== brand) e.currentTarget.style.background = '#2a2010';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBrand !== brand) e.currentTarget.style.background = '#141414';
                  }}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixture list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 12px 12px 12px' }}>
        {filteredFixtures.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#555555', fontSize: 11 }}>
            No fixtures found
          </div>
        ) : (
          filteredFixtures.map((fixture, idx) => {
            const key = `${fixture.name}-${idx}`;
            return (
              <FixtureCard
                key={key}
                fixture={fixture}
                isExpanded={expandedSet.has(key)}
                onToggle={() => toggleExpanded(key)}
                onVariantClick={handleVariantClick}
              />
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid #2a2a2a', background: '#0f0f0f',
        fontSize: 9, color: '#555555', display: 'flex', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <span>{filteredFixtures.length} fixture{filteredFixtures.length !== 1 ? 's' : ''}</span>
        <span>{fixtureData.metadata.totalVariants} variants</span>
      </div>
    </div>
  );
}
