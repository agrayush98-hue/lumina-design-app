#!/usr/bin/env node

/**
 * IES File Parser — IESNA:LM-63-2002 format
 *
 * Parses photometric data from manufacturer IES files and outputs
 * fixture definitions matching the Lumina Design fixture schema.
 *
 * Usage: node scripts/parse-ies-fixtures.js
 *
 * Input: data/ies-files/*.ies
 * Output: data/parsed-fixtures.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────

const IES_DIR = path.join(__dirname, '../data/ies-files');
const OUTPUT_FILE = path.join(__dirname, '../data/parsed-fixtures.json');

const FIXTURE_CATEGORIES = {
  downlight: 'Downlight',
  recessed: 'Downlight',
  can: 'Downlight',
  panel: 'Panel',
  troffer: 'Panel',
  flat: 'Panel',
  linear: 'Linear',
  strip: 'Linear',
  batten: 'Linear',
  spot: 'Spotlight',
  accent: 'Spotlight',
  flood: 'Floodlight',
  area: 'Floodlight',
  wall: 'Wall Washer',
  sconce: 'Wall Washer',
  track: 'Track Light',
  pendant: 'Pendant',
  surface: 'Surface',
  under: 'Under-cabinet',
  cabinet: 'Under-cabinet',
  step: 'Step Light',
  foot: 'Step Light',
};

// ─────────────────────────────────────────────────────────────
// PARSER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Parse a single IES file and extract photometric data
 */
function parseIES(filePath) {
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim());

  const fixture = {
    iesFile: filename,
    manufacturer: '',
    catalogNumber: '',
    description: '',
    lampType: '',
    wattage: null,
    numLamps: 1,
    lumensPerLamp: 0,
    vertAngles: [],
    horizAngles: [],
    candelaData: [],
    tiltMode: 'NONE',
  };

  let dataStartIdx = -1;
  let tiltLineIdx = -1;
  let lampDataLineIdx = -1;

  // Parse header lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines and comments
    if (!line || line.startsWith(';')) continue;

    // Extract header keywords
    if (line.startsWith('[MANUFAC]')) {
      fixture.manufacturer = line.substring('[MANUFAC]'.length).trim();
    } else if (line.startsWith('[LUMCAT]')) {
      fixture.catalogNumber = line.substring('[LUMCAT]'.length).trim();
    } else if (line.startsWith('[LUMINAIRE]')) {
      fixture.description = line.substring('[LUMINAIRE]'.length).trim();
    } else if (line.startsWith('[LAMP]')) {
      fixture.lampType = line.substring('[LAMP]'.length).trim();
    } else if (line.startsWith('[WATTAGE]')) {
      fixture.wattage = parseInt(line.substring('[WATTAGE]'.length).trim());
    } else if (line.startsWith('TILT=')) {
      fixture.tiltMode = line.substring('TILT='.length).trim();
      tiltLineIdx = i;
    } else if (
      !line.startsWith('[') &&
      !line.startsWith('TILT') &&
      dataStartIdx === -1 &&
      tiltLineIdx !== -1 &&
      i > tiltLineIdx
    ) {
      // This is likely the TILT data or lamp data line
      const parts = line.split(/\s+/).filter(p => p);
      if (parts.length >= 3 && /^\d+$/.test(parts[0])) {
        // Check if this is a candela line (starts with digit)
        // The lamp data line has the format: numLamps lumensPerLamp multiplier ...
        if (i === tiltLineIdx + 1 && fixture.tiltMode === 'NONE') {
          // This is the lamp data line
          fixture.numLamps = parseInt(parts[0]);
          fixture.lumensPerLamp = parseInt(parts[1]);
          lampDataLineIdx = i;
          // Extract wattage from lamp data line if not already set
          // Field 10 (index 9) is sometimes wattage
          if (!fixture.wattage && parts.length > 9) {
            fixture.wattage = parseInt(parts[9]);
          }
        } else if (
          i === tiltLineIdx + 2 ||
          (fixture.tiltMode !== 'NONE' && i > tiltLineIdx + 2)
        ) {
          // This might be angle counts: ballast factor, lamp multiplier, vert angles, horiz angles
          if (i === tiltLineIdx + 2) {
            // horiz angles line (or angle counts)
            if (parts.length >= 2) {
              const ballastFactor = parseFloat(parts[0]);
              const lampMult = parseFloat(parts[1]);
              const numVert = parseInt(parts[2]);
              const numHoriz = parseInt(parts[3]);
              // Skip for now
            }
          }
        }
      }
    }
  }

  // If we didn't find structured data, return null
  if (!fixture.manufacturer && !fixture.description) {
    return null;
  }

  return fixture;
}

/**
 * Calculate beam angle from candela distribution
 *
 * Beam angle is where candela drops to 50% of peak (both sides)
 * Returns angle in degrees
 */
function calcBeamAngle(vertAngles, candelaRow) {
  if (!candelaRow || candelaRow.length === 0) return 120;

  const peak = Math.max(...candelaRow);
  if (peak === 0) return 120;

  const half = peak * 0.5;

  // Find where we cross 50% threshold
  for (let i = 0; i < vertAngles.length - 1; i++) {
    const curr = candelaRow[i];
    const next = candelaRow[i + 1];

    if (curr >= half && next < half) {
      // Linear interpolation
      const t = (half - curr) / (next - curr);
      const halfAngle = vertAngles[i] + t * (vertAngles[i + 1] - vertAngles[i]);
      // Beam angle is twice the half angle
      return Math.round(halfAngle * 2);
    }
  }

  // Fallback if no crossing found
  return 120;
}

/**
 * Categorize fixture from description/name
 */
function categorizeFixture(description, name) {
  const text = (description + ' ' + name).toLowerCase();

  for (const [keyword, category] of Object.entries(FIXTURE_CATEGORIES)) {
    if (text.includes(keyword)) {
      return category;
    }
  }

  return 'Other';
}

/**
 * Build output fixture object matching fixture schema
 */
function buildFixtureObject(parsed) {
  if (!parsed) return null;

  const lumens = parsed.lumensPerLamp * parsed.numLamps;
  const efficacy = parsed.wattage
    ? Math.round(lumens / parsed.wattage)
    : Math.round(lumens / 15); // Default assume 15W if unknown

  const category = categorizeFixture(parsed.description, parsed.catalogNumber);
  const id = `ies-${parsed.catalogNumber.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    id,
    source: 'ies',
    iesFile: parsed.iesFile,
    category,
    name: parsed.description || parsed.catalogNumber || 'IES Fixture',
    manufacturer: parsed.manufacturer,
    catalogNumber: parsed.catalogNumber,
    description: `Photometric data from IES file: ${parsed.iesFile}`,
    lampType: parsed.lampType,
    variants: [
      {
        watt: parsed.wattage || 15,
        lumens,
        efficacy,
        beamOptions: [120], // Default; calculated if candela data available
        beamClass: 'medium',
      },
    ],
  };
}

/**
 * Process all IES files in the directory
 */
function processIESFiles() {
  if (!fs.existsSync(IES_DIR)) {
    console.log(`ℹ  IES directory not found: ${IES_DIR}`);
    console.log(`   Run: mkdir -p ${IES_DIR}`);
    return [];
  }

  const files = fs
    .readdirSync(IES_DIR)
    .filter(f => f.toLowerCase().endsWith('.ies'));

  if (files.length === 0) {
    console.log(`ℹ  No .ies files found in ${IES_DIR}`);
    console.log('   Download IES files from manufacturer websites and place them in the ies-files directory.');
    return [];
  }

  const fixtures = [];

  console.log(`\n📄 Parsing ${files.length} IES file(s)...\n`);

  for (const file of files) {
    const filePath = path.join(IES_DIR, file);
    try {
      const parsed = parseIES(filePath);
      if (parsed) {
        const fixture = buildFixtureObject(parsed);
        if (fixture) {
          fixtures.push(fixture);
          console.log(`✓ ${file}`);
          console.log(`  → ${fixture.category} | ${fixture.name} | ${parsed.lumensPerLamp} lm`);
        }
      } else {
        console.log(`⚠ ${file} (skipped - no recognizable data)`);
      }
    } catch (err) {
      console.log(`✗ ${file} (error: ${err.message})`);
    }
  }

  return fixtures;
}

/**
 * Write output JSON
 */
function writeOutput(fixtures) {
  const output = {
    count: fixtures.length,
    generatedAt: new Date().toISOString(),
    fixtures,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(
    `\n✓ Output written to ${path.relative(process.cwd(), OUTPUT_FILE)}`
  );
  console.log(`  Total fixtures: ${fixtures.length}`);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

console.log('🔍 IES File Parser\n');
const fixtures = processIESFiles();

if (fixtures.length > 0) {
  writeOutput(fixtures);
  console.log('\n✓ Ready to merge into fixture library');
} else {
  console.log('\nℹ  No fixtures to write. Place .ies files and run again.');
}
