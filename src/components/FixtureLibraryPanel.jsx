import React, { useState, useMemo } from 'react';
import standardFixtures from '../data/complete-fixture-library.json';
import brandedFixtures from '../data/branded-fixture-library.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getBeamColor = (deg) => {
  if (deg <= 24) return '#3b82f6';
  if (deg <= 60) return '#f59e0b';
  return '#10b981';
};

// ── Fixture visual presets by category ───────────────────────────────────────
// Each entry: { shape, fill, stroke, glowColor, visualRadius }
// shape must match a case in DesignCanvas LightSymbol switch

const FIXTURE_VISUALS = {
  // Downlights — circle family
  'Downlight': {
    default:  { shape: 'circle',    fill: '#ffe9b0', stroke: '#ffb300', glow: 'rgba(255,179,0,0.12)',  r: 7  },
    'COB Downlight':          { shape: 'circle',    fill: '#ffe9b0', stroke: '#ffb300', glow: 'rgba(255,179,0,0.12)',  r: 7  },
    'SMD Downlight':          { shape: 'circle',    fill: '#fff5c0', stroke: '#e8d020', glow: 'rgba(232,208,0,0.12)',  r: 8  },
    'Gimbal / Adjustable Downlight': { shape: 'gimbal', fill: '#ffd8a0', stroke: '#ff8c00', glow: 'rgba(255,140,0,0.14)', r: 7 },
    'Surface-Mount Downlight':{ shape: 'circle',    fill: '#ffeec0', stroke: '#e0a800', glow: 'rgba(224,168,0,0.12)',  r: 9  },
  },

  // Panels — square with grid
  'Panel': {
    default:  { shape: 'panel-grid', fill: '#d0eaff', stroke: '#4da6ff', glow: 'rgba(77,166,255,0.12)', r: 13 },
  },

  // Spotlights — diamond (directional, pointed)
  'Spotlight': {
    default:  { shape: 'diamond',    fill: '#c8d8f8', stroke: '#2196f3', glow: 'rgba(33,150,243,0.14)', r: 7  },
    'Track Spotlight':        { shape: 'diamond',    fill: '#b8d4f8', stroke: '#1976d2', glow: 'rgba(25,118,210,0.14)', r: 7 },
  },

  // Track system — rail + head
  'Track_System': {
    default:  { shape: 'track',      fill: '#c0d8f8', stroke: '#1e88e5', glow: 'rgba(30,136,229,0.12)', r: 8  },
  },

  // LED Strip — thin pill (point) or handled by strip tool
  'LED_Strip': {
    default:  { shape: 'cove-slot',  fill: '#e8d0ff', stroke: '#9c5cd0', glow: 'rgba(156,92,208,0.14)', r: 6  },
    'Rigid LED Bar':          { shape: 'pill',      fill: '#d8c0ff', stroke: '#7b3fd4', glow: 'rgba(123,63,212,0.14)', r: 6  },
  },

  // Linear — wide rectangle
  'Linear': {
    default:  { shape: 'rectangle',  fill: '#ffe0c0', stroke: '#ff9940', glow: 'rgba(255,153,64,0.12)',  r: 10 },
  },

  // Architectural — cove slot (very thin elongated)
  'Architectural': {
    default:  { shape: 'cove-slot',  fill: '#a8f0f0', stroke: '#00bcd4', glow: 'rgba(0,188,212,0.14)',   r: 7  },
    'Wall Wash Light':        { shape: 'flood',     fill: '#b8e8ff', stroke: '#1e88e5', glow: 'rgba(30,136,229,0.12)', r: 9 },
    'Cove / Recessed Cove Light': { shape: 'cove-slot', fill: '#a8f8f8', stroke: '#00acc1', glow: 'rgba(0,172,193,0.14)', r: 6 },
  },

  // High Bay — octagon (industrial UFO shape)
  'High_Bay': {
    default:  { shape: 'octagon',    fill: '#f8d4a0', stroke: '#e67c2c', glow: 'rgba(230,124,44,0.16)',  r: 14 },
    'Low Bay Light':          { shape: 'hexagon',   fill: '#fff3c0', stroke: '#f9a825', glow: 'rgba(249,168,37,0.14)', r: 11 },
    'Linear High Bay':        { shape: 'rectangle', fill: '#f8d4a0', stroke: '#e67c2c', glow: 'rgba(230,124,44,0.14)', r: 12 },
    'Explosion-Proof / Hazardous Area Light': { shape: 'hexagon', fill: '#d8d0c8', stroke: '#6d4c41', glow: 'rgba(109,76,65,0.12)', r: 11 },
  },

  // Floodlights — custom floodlight shape
  'Floodlight': {
    default:  { shape: 'floodlight', fill: '#f8a8a8', stroke: '#f44336', glow: 'rgba(244,67,54,0.16)',   r: 11 },
    'LED Wall Pack':          { shape: 'semicircle', fill: '#c8d8e8', stroke: '#546e7a', glow: 'rgba(84,110,122,0.12)', r: 9 },
  },

  // Street lights — cobra-arm shape
  'Street_Light': {
    default:  { shape: 'streetlight', fill: '#b8c8d8', stroke: '#607d8b', glow: 'rgba(96,125,139,0.12)', r: 9 },
  },

  // Garden / landscape — spike
  'Garden_Light': {
    default:  { shape: 'spike',      fill: '#c8f0c0', stroke: '#43a047', glow: 'rgba(67,160,71,0.14)',   r: 8  },
    'Inground Uplight':       { shape: 'ring',      fill: '#a8f0a0', stroke: '#2e7d32', glow: 'rgba(46,125,50,0.14)',  r: 7  },
  },

  // Wall lights — semicircle
  'Wall_Light': {
    default:  { shape: 'semicircle', fill: '#f8e8c0', stroke: '#d4a843', glow: 'rgba(212,168,67,0.14)',  r: 8  },
  },

  // Indoor/Outdoor
  'Indoor/Outdoor': {
    default:  { shape: 'octagon',    fill: '#e0f0e0', stroke: '#66bb6a', glow: 'rgba(102,187,106,0.12)', r: 9  },
    'Step / Stair Light':     { shape: 'pill',      fill: '#d0e8d8', stroke: '#4caf50', glow: 'rgba(76,175,80,0.12)',  r: 5  },
    'LED Canopy Light':       { shape: 'octagon',   fill: '#d8e8f8', stroke: '#78909c', glow: 'rgba(120,144,156,0.12)', r: 12 },
  },

  // Pendants — pendant (circle with cord)
  'Pendant': {
    default:  { shape: 'pendant',    fill: '#f8d8f0', stroke: '#c2185b', glow: 'rgba(194,24,91,0.12)',   r: 8  },
    'LED Chandelier':         { shape: 'chandelier', fill: '#d4a8f0', stroke: '#7b1fa2', glow: 'rgba(123,31,162,0.14)', r: 10 },
  },

  // Emergency — cross-dot
  'Emergency': {
    default:  { shape: 'cross-dot',  fill: '#c8f0c8', stroke: '#2e7d32', glow: 'rgba(46,125,50,0.14)',   r: 7  },
  },
}

function getFixtureVisuals(category, fixtureName) {
  const catVisuals = FIXTURE_VISUALS[category]
  if (!catVisuals) {
    // Fallback for unknown categories
    return { fixtureShape: 'circle', fill: '#ffe9b0', stroke: '#ffb300', glowColor: 'rgba(255,179,0,0.10)', visualRadius: 7 }
  }
  const v = catVisuals[fixtureName] ?? catVisuals['default']
  return {
    fixtureShape: v.shape,
    fill:         v.fill,
    stroke:       v.stroke,
    glowColor:    v.glow,
    visualRadius: v.r,
  }
}

const categoryLabel = (cat) => ({
  'ALL':          'All',
  'Downlight':    'Downlight',
  'Spotlight':    'Spotlight',
  'Panel':        'Panel',
  'Linear':       'Linear',
  'LED_Strip':    'LED Strip',
  'High_Bay':     'High Bay',
  'Floodlight':   'Floodlight',
  'Street_Light': 'Street Light',
  'Garden_Light': 'Garden Light',
  'Wall_Light':   'Wall Light',
  'Architectural':'Architectural',
  'Track_System': 'Track System',
  'Indoor/Outdoor':'In/Outdoor',
  'Pendant':      'Pendant',
  'Emergency':    'Emergency',
}[cat] || cat.replace(/_/g, ' '));

const wattageColor = (w) =>
  !w       ? '#888888' :
  w <= 10  ? '#16a34a' :
  w <= 20  ? '#0284c7' :
  w <= 40  ? '#d97706' : '#dc2626';

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
        background: hovered ? '#1a1a1a' : '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        padding: 10,
        cursor: 'pointer',
        transition: 'background 0.15s ease'
      }}
    >
      {/* Wattage */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
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

      {/* Lumens + Efficacy + extra tags */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 9, color: '#888888', marginBottom: 8, lineHeight: 1.5
      }}>
        {isStrip
          ? `${variant.lumens_per_meter}lm/m`
          : `${variant.lumens}lm`}
        {variant.efficacy && ` · ${variant.efficacy}lm/W`}
        {variant.density && ` · ${variant.density}`}
        {variant.length && ` · ${variant.length}`}
      </div>

      {/* CCT Badge */}
      {variant.cct && (
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 10, color: '#888888',
          background: '#1e1e1e', padding: '2px 6px',
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
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9, fontWeight: 600,
                  color: active ? '#ffffff' : '#b8860b',
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
          width: '100%', padding: '7px',
          background: '#d4a843', border: 'none', borderRadius: 4,
          color: '#0a0a0a', fontFamily: "'Inter', sans-serif",
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.02em', transition: 'opacity 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
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
      background: '#141414',
      border: `1px solid ${isExpanded ? '#d4a843' : '#222222'}`,
      borderRadius: 8,
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease'
    }}>
      {/* Card Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '10px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isExpanded ? 'rgba(212,168,67,0.08)' : 'transparent',
          transition: 'background 0.15s ease'
        }}
        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#1a1a1a'; }}
        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 12, fontWeight: 600, color: '#cccccc',
            marginBottom: 4, letterSpacing: '0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {fixture.name}
          </div>

          {/* Brand + subcategory + CRI row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {fixture.brand && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10, fontWeight: 600, color: '#d4a843',
                background: 'rgba(212,168,67,0.1)', padding: '1px 6px',
                borderRadius: 3, letterSpacing: '0.03em'
              }}>
                {fixture.brand.toUpperCase()}
              </span>
            )}
            {fixture.subcategory && (
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10, color: '#888888',
                textTransform: 'uppercase', letterSpacing: '0.03em'
              }}>
                {fixture.subcategory}
              </span>
            )}
            {fixture.cri && (
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 10,
                color: fixture.cri >= 90 ? '#16a34a' : fixture.cri >= 80 ? '#0284c7' : '#aaaaaa'
              }}>
                CRI{fixture.cri}
              </span>
            )}
            {wattRange && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#888888' }}>
                {wattRange}
              </span>
            )}
            {fixture.ipRating && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#aaaaaa' }}>
                {fixture.ipRating.split(' / ')[0]}
              </span>
            )}
            {fixture.dimming && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: '#aaaaaa' }}>
                {fixture.dimming.split(' / ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Count + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 10, color: '#aaaaaa'
          }}>
            {fixture.variants.length}v
          </span>
          <span style={{
            fontSize: 10, color: '#aaaaaa',
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
          padding: '8px 10px 10px',
          background: '#0e0e0e',
          borderTop: '1px solid #1e1e1e'
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
    const category = fixture.category;
    const beamAngle = selectedBeam ||
      (variant.beamOptions ? variant.beamOptions[0] : fixture.beam) || 36;

    const vis = getFixtureVisuals(category, fixture.name);

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
      fixtureShape: vis.fixtureShape,
      fixtureColor: vis.fill,
      fill:         vis.fill,
      stroke:       vis.stroke,
      glowColor:    vis.glowColor,
      visualRadius: vis.visualRadius,
      ...(variant.watt_per_meter && {
        wattPerMeter: variant.watt_per_meter,
        lumensPerMeter: variant.lumens_per_meter
      }),
      ...(variant.size && { size: variant.size })
    });
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

        {/* STANDARD / BRANDED tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {['STANDARD', 'BRANDED'].map(tab => (
            <button
              key={tab}
              onClick={() => { setLibraryTab(tab); setActiveCategory('ALL'); setSelectedBrand('ALL'); setSearchQuery(''); setExpandedSet(new Set()); }}
              style={{
                flex: 1, padding: '5px 8px',
                background: libraryTab === tab ? 'rgba(212,168,67,0.1)' : 'transparent',
                border: libraryTab === tab ? '1px solid #d4a843' : '1px solid #2a2a2a',
                borderRadius: 5,
                color: libraryTab === tab ? '#d4a843' : '#555555',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.03em', transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (libraryTab !== tab) {
                  e.currentTarget.style.borderColor = '#444444';
                  e.currentTarget.style.color = '#cccccc';
                }
              }}
              onMouseLeave={(e) => {
                if (libraryTab !== tab) {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#555555';
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
            width: '100%', padding: '7px 10px', boxSizing: 'border-box',
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 5,
            color: '#cccccc', fontSize: 12, outline: 'none', marginBottom: 10
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#d4a843'; e.currentTarget.style.background = '#1e1e1e'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = '#1a1a1a'; }}
        />

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '3px 8px',
                background: activeCategory === cat ? 'rgba(212,168,67,0.1)' : 'transparent',
                border: activeCategory === cat ? '1px solid #d4a843' : '1px solid #2a2a2a',
                borderRadius: 4,
                color: activeCategory === cat ? '#d4a843' : '#555555',
                fontSize: 11, fontWeight: 500, cursor: 'pointer',
                letterSpacing: '0.02em', transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = '#444444';
                  e.currentTarget.style.color = '#cccccc';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#555555';
                }
              }}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Brand pills — BRANDED tab only */}
        {libraryTab === 'BRANDED' && (
          <div style={{ marginTop: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: '#999999',
              letterSpacing: '0.06em', marginBottom: 6
            }}>
              BRANDS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['ALL', ...Array.from(new Set(fixtureData.fixtures.map(f => f.brand).filter(Boolean)))].map(brand => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  style={{
                    padding: '3px 8px',
                    background: selectedBrand === brand ? '#d4a843' : 'transparent',
                    border: '1px solid #d4a843',
                    borderRadius: 4,
                    color: selectedBrand === brand ? '#0a0a0a' : '#b8860b',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    letterSpacing: '0.02em', transition: 'all 0.15s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBrand !== brand) e.currentTarget.style.background = '#1a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBrand !== brand) e.currentTarget.style.background = 'transparent';
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
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 10px 12px' }}>
        {filteredFixtures.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: '#999999', fontSize: 12 }}>
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
        padding: '8px 14px', borderTop: '1px solid #1a1a1a', background: '#0d0d0d',
        fontSize: 11, color: '#555555', display: 'flex', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <span>{filteredFixtures.length} fixture{filteredFixtures.length !== 1 ? 's' : ''}</span>
        <span>{filteredFixtures.reduce((acc, f) => acc + f.variants.length, 0)} variants</span>
      </div>
    </div>
  );
}
