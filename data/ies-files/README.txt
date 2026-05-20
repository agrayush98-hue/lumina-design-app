IES Photometric Files
=====================

Place manufacturer IES files here before running the parser.

Good sources (free downloads):
  - https://ieslibrary.com               — large open archive
  - https://www.dial.de/en/dialux/       — DIALux fixture library
  - Philips: https://www.signify.com/en-in/support/photometric-data
  - Osram:   https://www.osram.com/oe/photometric-data
  - Tridonic: https://www.tridonic.com/en/products/photometric-data
  - GE Current: https://www.gecurrent.com/support/product-documentation

After downloading, run:
  node scripts/parse-ies-fixtures.js

Output will be written to: data/parsed-fixtures.json

Tips:
  - Rename files to something descriptive before parsing
  - Supports IESNA LM-63-1986, LM-63-1991, LM-63-1995, LM-63-2002
  - Files with TILT=INCLUDE (adjustable luminaires) are parsed but flagged
  - The parser handles missing [WATTAGE] headers gracefully
