# CLI Commands

All commands require `--target-dir` pointing at the directory set in `TRACE_RECORDS_DATA_DIR`. Multiple `--target-dir` flags are supported to combine reports from separate directories.

---

## serve

Start a local HTTP(S) server and open the report in the browser.

```bash
traceability-matrices serve \
  --target-dir=cypress/coverage \
  [--port=8477] \
  [--compact=true] \
  [--theme=light|dark|hc-light|hc-dark] \
  [--key=./key.pem --cert=./cert.pem]
```

| Flag | Default | Description |
|---|---|---|
| `--target-dir` | — | **Required.** Coverage directory. Repeatable. |
| `--port` | `8477` | HTTP port |
| `--compact` | `false` | Compact table view (categories as rows) — better for deep structures |
| `--theme` | `light` | UI theme: `light`, `dark`, `hc-light`, `hc-dark` |
| `--key` + `--cert` | — | Enable HTTPS (both required together) |

---

## generate

Write static HTML report files.

```bash
traceability-matrices generate \
  --target-dir=cypress/coverage \
  --output-dir=coverage-static \
  [--compact=true] \
  [--theme=light|dark|hc-light|hc-dark] \
  [--force-cleanup=true]
```

| Flag | Default | Description |
|---|---|---|
| `--target-dir` | — | **Required.** Coverage directory. Repeatable. |
| `--output-dir` | — | **Required.** Where to write HTML files. |
| `--compact` | `false` | Compact table layout |
| `--theme` | `light` | UI theme |
| `--force-cleanup` | `false` | Delete output dir contents before generating |

---

## threshold

Exit with a non-zero code if coverage is below thresholds. Use in CI pipelines.

```bash
traceability-matrices threshold \
  --target-dir=cypress/coverage \
  [--total=80] \
  [--per-feature=60]
```

| Flag | Default | Description |
|---|---|---|
| `--target-dir` | — | **Required.** Coverage directory. Repeatable. |
| `--total` | `100` | Minimum combined coverage % across all features |
| `--per-feature` | `100` | Minimum coverage % per individual feature |

---

## stats

Print per-feature coverage breakdown to stdout.

```bash
traceability-matrices stats \
  --target-dir=cypress/coverage \
  [--feature="Feature Title"]
```

`--feature` can be repeated to filter to specific features.

---

## lcov

Generate LCOV coverage file for SonarQube or similar tools.

```bash
traceability-matrices lcov \
  --target-dir=cypress/coverage \
  --output-dir=lcov-output \
  [--relative-dir=lcov-output] \
  [--force-cleanup=true]
```

---

## scan

Pre-register feature files so they appear in reports with 0% coverage before any test runs.

```bash
traceability-matrices scan \
  --features-dir=./cypress/features \
  --target-dir=cypress/coverage
```

`--features-dir` can be repeated. Scans sub-directories recursively.

Supported extensions: `.md`, `.markdown`, `.json`, `.yaml`, `.yml`, `.xml`, `.html`, `.htm`.
