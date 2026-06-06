IES File Parser — Workflow
==========================

This directory stores IESNA:LM-63 photometric data files downloaded from lighting manufacturers.

Workflow:
1. Download .ies files from manufacturer websites (Philips, Osram, Eaton, etc.)
2. Drop them into this directory
3. Run: node scripts/parse-ies-fixtures.js
4. Check data/parsed-fixtures.json for parsed output
5. Merge fixtures into complete-fixture-library.json as needed

Example manufacturers:
- Philips: downloads.lighting.philips.com
- Osram: osram.com/os/en/products/
- Eaton: eaton.com/en-us/catalog/electrical/

File Format:
IESNA:LM-63-2002 text format containing:
- Header keywords: [MANUFAC], [LUMCAT], [LUMINAIRE], [LAMP], [WATTAGE]
- Photometric data: candela distribution by vertical and horizontal angles
- Automatically parsed to extract lumens, beam angle, efficacy

All specs extracted are category-level industry standards — NO brand names or model numbers are used in the output fixture library.
