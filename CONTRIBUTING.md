## Tests

- We do `FORCE_COLOR=0` in npm test script so that we disable `kleur` colors in snapshots all the time. It would be nice to put the DX of colors into tests but needs some work. Node 12/14 results in different codes, [thus different snapshots](https://github.com/prisma/nexus-prisma/pull/3#issuecomment-782432471). See test-mode feature request here: https://github.com/lukeed/kleur/issues/47#issue-812419257.
