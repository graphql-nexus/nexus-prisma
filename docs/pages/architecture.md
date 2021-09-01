## Architecture

![nexus-prisma-architecture](https://user-images.githubusercontent.com/284476/118728589-70fce780-b802-11eb-8c8b-4328ef5d6fb5.png)

1. You or a script (CI, programmatic, etc.) run `$ prisma generate`.
2. Prisma generator system reads your Prisma schema file
3. Prisma generator system runs the Nexus Prisma generator passing it the "DMMF", a structured representation of your Prisma schema.
4. Nexus Prisma generator reads your Nexus Prisma generator configuration if present.
5. Nexus Prisma generator writes generated source code into its own package space in your node_modules.
6. Later when you run your code it imports `nexus-prisma` which hits the generated entrypoint.
7. The generated runtime is actually thin, making use of a larger static runtime.