# nexus-prisma

[![trunk](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml)

Official Prisma plugin for Nexus

## Features

### Opt-outable friendly runtime peer dependency checks

When `nexus-prisma` is imported it will validate that your project has peer dependencies setup correctly.

If a peer dependenvy is not installed it `nexus-prisma` will log an error and then exit 1. If its version does not satify the range supported by the current version of `nexus-prisma` that you have installed, then a warning will be logged. If you want to opt-out of this validation then set an envar as follows:

```
NO_PEER_DEPENDENCY_CHECK=true|1
PEER_DEPENDENCY_CHECK=false|0
```
