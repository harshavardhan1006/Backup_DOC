# WVCP VisualLab — Supported Dataset Formats

## Overview

WVCP VisualLab supports importing weighted graphs from three file formats:
- **CSV** — Comma-separated values
- **JSON** — JavaScript Object Notation
- **TXT / Edge-list** — Plain text with sections

All formats must specify:
1. **Vertices** with integer IDs and positive integer weights
2. **Edges** as pairs of vertex IDs

## CSV Format

### Single-File CSV

A single CSV file with two sections separated by a blank line:

```csv
vertex_id,weight
0,8
1,5
2,12
3,7
4,3

source,target
0,1
0,2
1,3
2,3
3,4
```

### Rules
- First section header must contain `vertex_id` and `weight`
- Second section header must contain `source` and `target`
- Sections are separated by one or more blank lines
- Vertex IDs must be non-negative integers
- Weights must be positive integers (≥ 1)
- Edge endpoints must reference valid vertex IDs

## JSON Format

```json
{
    "vertices": [
        {"id": 0, "weight": 8},
        {"id": 1, "weight": 5},
        {"id": 2, "weight": 12},
        {"id": 3, "weight": 7},
        {"id": 4, "weight": 3}
    ],
    "edges": [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
        [3, 4]
    ]
}
```

### Rules
- `vertices` must be an array of objects with `id` (integer) and `weight` (positive integer)
- `edges` must be an array of 2-element arrays `[source, target]`
- Both `source` and `target` must reference valid vertex IDs
- Self-loops (`[0, 0]`) are rejected
- Duplicate edges are warned but accepted (stored once)

## TXT / Edge-list Format

```txt
# vertices
0 8
1 5
2 12
3 7
4 3

# edges
0 1
0 2
1 3
2 3
3 4
```

### Rules
- Lines starting with `#` are treated as section markers or comments
- `# vertices` section: each line is `vertex_id weight` (space-separated)
- `# edges` section: each line is `source target` (space-separated)
- Blank lines between sections are allowed
- Leading/trailing whitespace is trimmed
- Lines with only whitespace are ignored

## Validation

The importer validates the following:

| Check | Error/Warning |
|-------|---------------|
| Empty file | Error |
| Malformed data | Error |
| Missing vertices section | Error |
| Missing edges section | Error |
| Invalid vertex ID (non-integer) | Error |
| Invalid weight (non-positive) | Error |
| Duplicate vertex ID | Warning |
| Invalid edge reference | Error |
| Self-loop | Error (removed) |
| Duplicate edge | Warning (stored once) |
| Disconnected graph | Warning |
| No edges | Warning |

## Vertex ID Mapping

- Imported vertex IDs are mapped to 0-indexed internal IDs
- The original IDs are preserved in metadata
- All algorithms work with 0-indexed vertices internally

## Large Files

- Files with >10,000 vertices are processed with streaming parsing
- Progress is reported during import
- Memory-efficient data structures are used internally

## Example Files

Sample datasets are provided in the `datasets/` directory:
- `sample_tiny.json` — 5 vertices
- `sample_small.csv` — 8 vertices
- `sample_medium.txt` — 15 vertices
