## Tests

- We enable `FORCE_COLOR=1` in npm test script so that we capture `kleur` colors in snapshots even in CI. We capture colors since we want to avoid regressions of the DX that colours provide.
