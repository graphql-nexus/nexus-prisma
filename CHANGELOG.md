## [2.0.0](https://github.com/graphql-nexus/nexus-prisma/compare/v1.0.18...v2.0.0) (2023-08-01)


### ⚠ BREAKING CHANGES

* **deps:** Upgrade prisma dependencies to v5

### chore

* **deps:** update prisma monorepo to v5 (major) ([#656](https://github.com/graphql-nexus/nexus-prisma/issues/656)) ([c19b45d](https://github.com/graphql-nexus/nexus-prisma/commit/c19b45d8ec2cb11cc04a52ff4f7319c351476c79))

## [1.0.18](https://github.com/graphql-nexus/nexus-prisma/compare/v1.0.17...v1.0.18) (2023-07-31)


### Bug fixes

* remove esm build ([#696](https://github.com/graphql-nexus/nexus-prisma/issues/696)) ([9c549b8](https://github.com/graphql-nexus/nexus-prisma/commit/9c549b85f47d569bf7aa4f66667e1ecada55a278))

## [1.0.17](https://github.com/graphql-nexus/nexus-prisma/compare/v1.0.16...v1.0.17) (2023-07-28)


### Bug fixes

* release ([#690](https://github.com/graphql-nexus/nexus-prisma/issues/690)) ([f1443af](https://github.com/graphql-nexus/nexus-prisma/commit/f1443af47d3e0a2c8bc4267c73d32bd7026efc6e))

## [1.0.16](https://github.com/prisma/nexus-prisma/compare/v1.0.15...v1.0.16) (2023-07-28)


### Bug fixes

* some test ([103285e](https://github.com/prisma/nexus-prisma/commit/103285e410d700c4fa0c3291f8d23fbcfa1d8c99))

## [1.0.15](https://github.com/prisma/nexus-prisma/compare/v1.0.14...v1.0.15) (2023-07-28)


### Bug fixes

* test release ([50d9736](https://github.com/prisma/nexus-prisma/commit/50d97366a19a31e2727cbbb295fb37f323ca915d))

## [1.0.12](https://github.com/prisma/nexus-prisma/compare/v1.0.11...v1.0.12) (2023-07-26)


### Bug fixes

* add patch to print original error during semantic github publish ([#686](https://github.com/prisma/nexus-prisma/issues/686)) ([2f82d70](https://github.com/prisma/nexus-prisma/commit/2f82d70f2c819087288543254c51e9248fe667a6))

## [1.0.11](https://github.com/prisma/nexus-prisma/compare/v1.0.10...v1.0.11) (2023-07-26)


### Bug fixes

* **deps:** update dependency tslib to ^2.6.1 ([#678](https://github.com/prisma/nexus-prisma/issues/678)) ([e00e803](https://github.com/prisma/nexus-prisma/commit/e00e80329829f2bc4ed69ee35c866c1c0c3d6cc8))


### Testing

* fix retrieval of dynamic packages versions ([#676](https://github.com/prisma/nexus-prisma/issues/676)) ([4bdd177](https://github.com/prisma/nexus-prisma/commit/4bdd1777c26a2c452bbda53bd67dd5693b445e94))
* fix sigkill timeout for execa monitor ([#581](https://github.com/prisma/nexus-prisma/issues/581)) ([9fa8cc7](https://github.com/prisma/nexus-prisma/commit/9fa8cc7782c93972251f59553692977007fa6acf))
* prefer offline installation of dependencies in tests ([#677](https://github.com/prisma/nexus-prisma/issues/677)) ([dfcda87](https://github.com/prisma/nexus-prisma/commit/dfcda87f93f781fdfb55de2aa911fff48547e548))


### CI

* add dynamic retrieval lts nodejs version in ci workflows ([#680](https://github.com/prisma/nexus-prisma/issues/680)) ([1d65a9a](https://github.com/prisma/nexus-prisma/commit/1d65a9a0955ec8859aadb5e80d116ba3772417ab))
* switch scheduled weekly releases into on main branch push releases ([#683](https://github.com/prisma/nexus-prisma/issues/683)) ([20b53fc](https://github.com/prisma/nexus-prisma/commit/20b53fcd2f7a132e5e7fcc6998dbeb0f93659bf3))

## [1.0.10](https://github.com/prisma/nexus-prisma/compare/v1.0.9...v1.0.10) (2023-07-17)


### Bug fixes

* **deps:** update dependency semver to ^7.5.4 ([#647](https://github.com/prisma/nexus-prisma/issues/647)) ([faa50e7](https://github.com/prisma/nexus-prisma/commit/faa50e7dbfbadd41e528566c4abe76a481963d54))

## [1.0.9](https://github.com/prisma/nexus-prisma/compare/v1.0.8...v1.0.9) (2023-07-03)


### Bug fixes

* **deps:** update dependency graphql-scalars to ^1.22.2 ([#602](https://github.com/prisma/nexus-prisma/issues/602)) ([db9e024](https://github.com/prisma/nexus-prisma/commit/db9e024d9de051f42fb07d04191494301ed5a8bb))
* **deps:** update dependency semver to ^7.5.2 ([#610](https://github.com/prisma/nexus-prisma/issues/610)) ([5141551](https://github.com/prisma/nexus-prisma/commit/5141551918ef629291441f857255992dcc32f384))
* **deps:** update dependency semver to ^7.5.3 ([#623](https://github.com/prisma/nexus-prisma/issues/623)) ([c03bad3](https://github.com/prisma/nexus-prisma/commit/c03bad3bdc5ff754b95165807ff73779e5d83338))
* **deps:** update dependency tslib to ^2.6.0 ([#629](https://github.com/prisma/nexus-prisma/issues/629)) ([7a40f0d](https://github.com/prisma/nexus-prisma/commit/7a40f0d2be4f5ed3d915e3560d8e18bb6f229157))

## [1.0.8](https://github.com/prisma/nexus-prisma/compare/v1.0.7...v1.0.8) (2023-06-05)


### Testing

* refactor tests to use async methods and configurable packager (default: yarn) ([#578](https://github.com/prisma/nexus-prisma/issues/578)) ([754a70e](https://github.com/prisma/nexus-prisma/commit/754a70ee491fcc584335dab038f2a48d98b2f8c5))


### Bug fixes

* **deps:** replace dependency apollo-server with @apollo/server ^4.0.0 ([#471](https://github.com/prisma/nexus-prisma/issues/471)) ([d0e7a65](https://github.com/prisma/nexus-prisma/commit/d0e7a651c887f2a3cd7702142912caae3729aaaf))
* **deps:** update dependency graphql-scalars to ^1.22.1 ([#582](https://github.com/prisma/nexus-prisma/issues/582)) ([3b16a97](https://github.com/prisma/nexus-prisma/commit/3b16a978dbefbac77d31cabb45d31504c8a0c0ca))
* **deps:** update dependency tslib to ^2.5.3 ([#595](https://github.com/prisma/nexus-prisma/issues/595)) ([218d284](https://github.com/prisma/nexus-prisma/commit/218d284a5d02bc034633897c5c19234b1ed79201))

## [1.0.7](https://github.com/prisma/nexus-prisma/compare/v1.0.6...v1.0.7) (2023-05-22)


### Bug fixes

* **deps:** update dependency graphql-scalars to ^1.22.0 ([#561](https://github.com/prisma/nexus-prisma/issues/561)) ([84c896a](https://github.com/prisma/nexus-prisma/commit/84c896a2c0cc97f5128f9fa04a7dcefcc544f63b))
* **deps:** update dependency tslib to ^2.5.1 ([#560](https://github.com/prisma/nexus-prisma/issues/560)) ([8c07aa1](https://github.com/prisma/nexus-prisma/commit/8c07aa19fc013221e160231ad1ef2c6845da6524))
* **deps:** update dependency tslib to ^2.5.2 ([#563](https://github.com/prisma/nexus-prisma/issues/563)) ([ec59285](https://github.com/prisma/nexus-prisma/commit/ec592851dfaba67871251f5a9b1e49dcf4523df2))

## [1.0.6](https://github.com/prisma/nexus-prisma/compare/v1.0.5...v1.0.6) (2023-05-15)


### Bug fixes

* **deps:** update dependency semver to ^7.5.1 ([#505](https://github.com/prisma/nexus-prisma/issues/505)) ([53a01dc](https://github.com/prisma/nexus-prisma/commit/53a01dcdf5a22a5a305caab475370daba076d625))


### CI

* remove default assignees ([#552](https://github.com/prisma/nexus-prisma/issues/552)) ([16523ee](https://github.com/prisma/nexus-prisma/commit/16523ee56843c45ac652a5555017bf1f18250bf9))

## [1.0.5](https://github.com/prisma/nexus-prisma/compare/v1.0.4...v1.0.5) (2023-04-03)


### Bug fixes

* **deps:** update dependency graphql-scalars to ^1.21.3 ([#469](https://github.com/prisma/nexus-prisma/issues/469)) ([63a9ee3](https://github.com/prisma/nexus-prisma/commit/63a9ee3d61f3401807df440cfb414b21083ae692))

## [1.0.4](https://github.com/prisma/nexus-prisma/compare/v1.0.3...v1.0.4) (2023-01-30)


### CI

* avoid concurent execution of tests on PRs ([#381](https://github.com/prisma/nexus-prisma/issues/381)) ([7ce9aaa](https://github.com/prisma/nexus-prisma/commit/7ce9aaa168f68413e397bd08d6bfe5ace95e6cb1))
* double workflow timeouts ([#382](https://github.com/prisma/nexus-prisma/issues/382)) ([77dfa4b](https://github.com/prisma/nexus-prisma/commit/77dfa4b8b67f3324f03b75607bacba0411965dda))
* enable main release ([#368](https://github.com/prisma/nexus-prisma/issues/368)) ([dc0e45a](https://github.com/prisma/nexus-prisma/commit/dc0e45a725b59861b105568fc3ee5caf60bfba1e))
* move semantic-release under optionalDependencies ([#379](https://github.com/prisma/nexus-prisma/issues/379)) ([aab61f1](https://github.com/prisma/nexus-prisma/commit/aab61f16adbcf2f30f7ef99003db266e55914fd4))
* remove on push trigger for release workflow ([#369](https://github.com/prisma/nexus-prisma/issues/369)) ([d82617b](https://github.com/prisma/nexus-prisma/commit/d82617be98a29172889ec50a8fde8c3b8f21576e))
* switch to current lts node version 18 ([#365](https://github.com/prisma/nexus-prisma/issues/365)) ([b1abba8](https://github.com/prisma/nexus-prisma/commit/b1abba81f43dc31186b5e2676b1fa25638ac0f2c))


### Bug fixes

* **deps:** update dependency tslib to ^2.5.0 ([#409](https://github.com/prisma/nexus-prisma/issues/409)) ([1c38ddf](https://github.com/prisma/nexus-prisma/commit/1c38ddf20cd537a218db8d1194692054abb28956))
* **docs:** edit page on github ([#372](https://github.com/prisma/nexus-prisma/issues/372)) ([ae266a3](https://github.com/prisma/nexus-prisma/commit/ae266a3b18d0ba411afe70f569e672013002ac35))

## [1.0.3](https://github.com/prisma/nexus-prisma/compare/v1.0.2...v1.0.3) (2023-01-11)


### Bug fixes

* **deps:** update nextra packages to v2.2.0 ([#363](https://github.com/prisma/nexus-prisma/issues/363)) ([e2f49cf](https://github.com/prisma/nexus-prisma/commit/e2f49cf2aa0558fbc799e02e9bb98234eef5c645))

## [1.0.2](https://github.com/prisma/nexus-prisma/compare/v1.0.1...v1.0.2) (2023-01-11)


### Documentation

* update links and prepare docs for 1.x.x release ([9903a0a](https://github.com/prisma/nexus-prisma/commit/9903a0a4a54e5d5812e7d2a3ea32b104db8c20f3))


### CI

* fix main health workflow triggers ([#362](https://github.com/prisma/nexus-prisma/issues/362)) ([4a09851](https://github.com/prisma/nexus-prisma/commit/4a098517e28f19d014639c480be92702e0c73506))
* remove persistance of default credentials on release/prerelease workflows ([#364](https://github.com/prisma/nexus-prisma/issues/364)) ([708e5ca](https://github.com/prisma/nexus-prisma/commit/708e5cad38b6128e4db6f2531519cfad367a330c))
* remove timeout on prerelease and release jobs ([#359](https://github.com/prisma/nexus-prisma/issues/359)) ([51ccb56](https://github.com/prisma/nexus-prisma/commit/51ccb5605e37fa86ae920e984e3d86aa6d404896))

## [1.0.1](https://github.com/prisma/nexus-prisma/compare/v1.0.0...v1.0.1) (2023-01-09)


### Bug fixes

* **deps:** update nextra packages to v2.1.0 ([#357](https://github.com/prisma/nexus-prisma/issues/357)) ([cfff89e](https://github.com/prisma/nexus-prisma/commit/cfff89e76d54ce8a31eb2b727f090080e7ef02d6))

## 1.0.0 (2023-01-07)


### ⚠ BREAKING CHANGES

* **deps:** update dependency graphql to v16

Co-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>
Co-authored-by: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
* scalars module only exports named exports (#187)
* support latest Prisma (#164)
* no types namespace (#130)
* remove support for prisma 2.17
* support prisma 2.30 (#114)
* Prisma Int @id maps to GraphQL Int  (#23)
* better names, auto-import friendly, jsdoc (#12)
* validate that peer dep requirements are met
* **deps:** nexua and @prisma/client are peer dependencies
* hello world

### Features

* add bytes scalar support ([#75](https://github.com/prisma/nexus-prisma/issues/75)) ([88fd092](https://github.com/prisma/nexus-prisma/commit/88fd092d8c1b3856b9da9f04c343661406fe0eee))
* add default resolver for relation fields ([#25](https://github.com/prisma/nexus-prisma/issues/25)) ([4f5cd70](https://github.com/prisma/nexus-prisma/commit/4f5cd70a0ad82a3c18fad26b0105acb20a2c5073))
* add nexus_prisma bin for =<2.17 prisma users ([469c9e9](https://github.com/prisma/nexus-prisma/commit/469c9e928baf47cd0c3fe609703ccb6ca2fa42b2))
* add nexusPrisma default and named export ([704f07c](https://github.com/prisma/nexus-prisma/commit/704f07c4823d1f762b7d1419b7f87bc6d05678a3))
* add peer dep support for prisma 2.18.x ([2e898ab](https://github.com/prisma/nexus-prisma/commit/2e898abd1ecd2b25f71c4206b5c645d2acec03ad))
* add support for BigInt scalar ([#56](https://github.com/prisma/nexus-prisma/issues/56)) ([67ce824](https://github.com/prisma/nexus-prisma/commit/67ce824a41a36913188b4ff26b2b0732a16c0a43))
* add support for Decimal scalar ([#96](https://github.com/prisma/nexus-prisma/issues/96)) ([74da7c2](https://github.com/prisma/nexus-prisma/commit/74da7c236407e2cd1c9692dc544bae19728ba609))
* add support for reading configuration at generation time ([#27](https://github.com/prisma/nexus-prisma/issues/27)) ([275e03f](https://github.com/prisma/nexus-prisma/commit/275e03fec456a4e3d5d4c3903373cec3799bfaae))
* control rejectOnNotFound client setting ([#135](https://github.com/prisma/nexus-prisma/issues/135)) ([01daf38](https://github.com/prisma/nexus-prisma/commit/01daf38c3bd7a34402960920c1393901db7ca117))
* **deps:** nexua and @prisma/client are peer dependencies ([b28217b](https://github.com/prisma/nexus-prisma/commit/b28217b1651d532ab047eb7d0c24b7cff655f37e))
* emit model scalar fields ([#5](https://github.com/prisma/nexus-prisma/issues/5)) ([3a0a75a](https://github.com/prisma/nexus-prisma/commit/3a0a75a4cb37c3ad4530520a851d13e3be33e93d))
* esm support ([#127](https://github.com/prisma/nexus-prisma/issues/127)) ([eec4932](https://github.com/prisma/nexus-prisma/commit/eec4932f83065e46ff92cac75108dff3a34b15d9))
* gentime setting for output directory ([#166](https://github.com/prisma/nexus-prisma/issues/166)) ([83889bf](https://github.com/prisma/nexus-prisma/commit/83889bffd8d2bb14d61ca78003cbdcee60ab538c))
* hello world ([9667cd0](https://github.com/prisma/nexus-prisma/commit/9667cd0aac5f9224f3f1ba51d51cbbac452d7d13))
* Json & DateTime custom scalar support ([#9](https://github.com/prisma/nexus-prisma/issues/9)) ([df51143](https://github.com/prisma/nexus-prisma/commit/df51143eec22faf1d8e7dd959b4832c233fec0f6)), closes [#8](https://github.com/prisma/nexus-prisma/issues/8)
* Prisma Int [@id](https://github.com/id) maps to GraphQL Int  ([#23](https://github.com/prisma/nexus-prisma/issues/23)) ([624c745](https://github.com/prisma/nexus-prisma/commit/624c745d91dd0a5f46b45031a031e5bce7848893))
* settings system for runtime & gentime ([#42](https://github.com/prisma/nexus-prisma/issues/42)) ([ef76e45](https://github.com/prisma/nexus-prisma/commit/ef76e45f4ca5abab72b78a19aed722098421f23e))
* **settings:** allow customization of prisma client import ([#49](https://github.com/prisma/nexus-prisma/issues/49)) ([c8b5f6c](https://github.com/prisma/nexus-prisma/commit/c8b5f6cd644ae3fa077d5a1b1678e637fee4ae07))
* **settings:** allow disable jsdoc guide ([#136](https://github.com/prisma/nexus-prisma/issues/136)) ([9418649](https://github.com/prisma/nexus-prisma/commit/94186497e8c60ae8fc44e29adf630f6798ed20ba))
* support latest Prisma ([#164](https://github.com/prisma/nexus-prisma/issues/164)) ([594699d](https://github.com/prisma/nexus-prisma/commit/594699dec47dfa721c57cce1837ff337f3408eb8))
* support prisma 2.30 ([#114](https://github.com/prisma/nexus-prisma/issues/114)) ([b7c7927](https://github.com/prisma/nexus-prisma/commit/b7c7927359ed06c7ada16d9debdefe5c1ac6c305))
* support prisma up to 2.24 ([#70](https://github.com/prisma/nexus-prisma/issues/70)) ([2704ff2](https://github.com/prisma/nexus-prisma/commit/2704ff2c0954cf591136bc7fbce6d6cd189f56c9))
* support prisma up to 3 ([#147](https://github.com/prisma/nexus-prisma/issues/147)) ([0020742](https://github.com/prisma/nexus-prisma/commit/0020742420a0271e5578dc38c94051bd1facfe4c))
* support projecting enums ([#18](https://github.com/prisma/nexus-prisma/issues/18)) ([1c1cd13](https://github.com/prisma/nexus-prisma/commit/1c1cd13f22d087e138a25bc44267f24fab24f941))
* turn prisma client on graphql context validation into a formal check ([#180](https://github.com/prisma/nexus-prisma/issues/180)) ([72817f1](https://github.com/prisma/nexus-prisma/commit/72817f1f673eac1d096e367f56a2f7e88a9be9a8))
* Update official Prisma support up to 2.27 ([#100](https://github.com/prisma/nexus-prisma/issues/100)) ([db1010d](https://github.com/prisma/nexus-prisma/commit/db1010dada0c3f74ca117779234dc45dc92a4f71))
* Use JSONResolver for Json scalar ([#231](https://github.com/prisma/nexus-prisma/issues/231)) ([e4143ac](https://github.com/prisma/nexus-prisma/commit/e4143ac9f80317fbfcf9f8b3bd39881052502dd0))
* validate that peer dep requirements are met ([7976bf5](https://github.com/prisma/nexus-prisma/commit/7976bf58117bd8545e649522253209039693a08b))


### improve

* better names, auto-import friendly, jsdoc ([#12](https://github.com/prisma/nexus-prisma/issues/12)) ([6e395b9](https://github.com/prisma/nexus-prisma/commit/6e395b9f6b9ac66c43c95fc92f6f5bf67b6da70e))
* no types namespace ([#130](https://github.com/prisma/nexus-prisma/issues/130)) ([cbe3df8](https://github.com/prisma/nexus-prisma/commit/cbe3df864b8cb65300f7a705706a717ed23cdabd))
* remove support for prisma 2.17 ([e007721](https://github.com/prisma/nexus-prisma/commit/e007721b44b07fd2cd4614b4e21e1e8f744ba19c))


### Refactoring

* peer dep failure state labels ([03d3c64](https://github.com/prisma/nexus-prisma/commit/03d3c643ce21d3603318a4561f6e6e11ba80d4f4))
* resolver "constraints" ([#165](https://github.com/prisma/nexus-prisma/issues/165)) ([3c9991b](https://github.com/prisma/nexus-prisma/commit/3c9991b63efe59465a0bc5d7bf878bd623efa6cf))
* **tests:** use kont for tests ([#149](https://github.com/prisma/nexus-prisma/issues/149)) ([1218c7e](https://github.com/prisma/nexus-prisma/commit/1218c7ef40a580cb88991965e81a54a10896f774))


### Documentation

* "which should I use" guide ([599b76d](https://github.com/prisma/nexus-prisma/commit/599b76d200d3ebcfd2876adc64bc829efde8a74a))
* add jsdoc for $settings ([#90](https://github.com/prisma/nexus-prisma/issues/90)) ([98a2267](https://github.com/prisma/nexus-prisma/commit/98a2267c7d6142b2352ab79689230740558fcdb4))
* add missing issue reference ([eefa884](https://github.com/prisma/nexus-prisma/commit/eefa884a159d8df8281ca8ac92c675183d9d3709))
* architecture diagram ([5f4970f](https://github.com/prisma/nexus-prisma/commit/5f4970f7c0dac499acb965025f6d7f20a1f02e6a)), closes [#7](https://github.com/prisma/nexus-prisma/issues/7)
* cover projecting 1-to-1 relations ([#32](https://github.com/prisma/nexus-prisma/issues/32)) ([bb70ea4](https://github.com/prisma/nexus-prisma/commit/bb70ea4bc63ada5efff88deb37498bba804fb330))
* **jsdoc:** docPropagation docs ([#55](https://github.com/prisma/nexus-prisma/issues/55)) ([5b4e5e6](https://github.com/prisma/nexus-prisma/commit/5b4e5e6be2ca7bbcb25f56b7f4df35878ffb9387))
* list enum members in jsdoc ([#92](https://github.com/prisma/nexus-prisma/issues/92)) ([d806d56](https://github.com/prisma/nexus-prisma/commit/d806d568524beb4e8dc1de64a4f38cbb7f928580))
* mention patch ver support policy ([8e61651](https://github.com/prisma/nexus-prisma/commit/8e616516001f6f18b8d09ee0c56182aeb2319619))
* peer deps validation ([4992741](https://github.com/prisma/nexus-prisma/commit/49927410589450d39a1dec8c92e1401bbe94397a)), closes [#2](https://github.com/prisma/nexus-prisma/issues/2)
* **readme:** adjust readiness disclaimer ([0e94cea](https://github.com/prisma/nexus-prisma/commit/0e94cea4cced128de7d473679ea840dbe51f02bf))
* **readme:** remove now-resolved limitation caveat ([b5fed98](https://github.com/prisma/nexus-prisma/commit/b5fed98d86af3a5cbc55804eb88f01fb867f92ff))
* setup hello world nextra site ([784705c](https://github.com/prisma/nexus-prisma/commit/784705cab0ee317b1425eaee7bacda29ca20ea98))
* update to nextra 2.0.0 ([#232](https://github.com/prisma/nexus-prisma/issues/232)) ([fccffd5](https://github.com/prisma/nexus-prisma/commit/fccffd5fdf054c704fb163d7a3bd4e6fa61ba4ea))
* update to nexus@^1.1 api ([#95](https://github.com/prisma/nexus-prisma/issues/95)) ([1d31a76](https://github.com/prisma/nexus-prisma/commit/1d31a76aada08492c9a014ef37b7782d940e210e))
* **website:** fix links in docs ([#144](https://github.com/prisma/nexus-prisma/issues/144)) ([abd56f2](https://github.com/prisma/nexus-prisma/commit/abd56f2975433dc58add27809e6ae50518cd671d))


### Testing

* **e2e:** adjust kitchen-sink snapshot ([#234](https://github.com/prisma/nexus-prisma/issues/234)) ([f831369](https://github.com/prisma/nexus-prisma/commit/f8313694b366145d2549a052a3f8ba473f75abc6))
* **e2e:** adjust ts-node-import-error snapshot ([#230](https://github.com/prisma/nexus-prisma/issues/230)) ([e464f2f](https://github.com/prisma/nexus-prisma/commit/e464f2f26c8ee7de39be6b90eae10037aa237bd5))
* extract hardcoded package.json declarations to fixtures ([#309](https://github.com/prisma/nexus-prisma/issues/309)) ([8cebf8a](https://github.com/prisma/nexus-prisma/commit/8cebf8afcce2821cdcff33b770763cbcedee5908))


### chore

* **deps:** update dependency graphql to v16 ([#256](https://github.com/prisma/nexus-prisma/issues/256)) ([b6678a4](https://github.com/prisma/nexus-prisma/commit/b6678a4927c97cb1f04f89eb85e263b3a7ff4b27))


### Bug fixes

* add lodash as production dep ([627aa54](https://github.com/prisma/nexus-prisma/commit/627aa54fc15cf19abca512456932432e7914daf7)), closes [#107](https://github.com/prisma/nexus-prisma/issues/107)
* bring back support for jest ([1705a54](https://github.com/prisma/nexus-prisma/commit/1705a5413f50a9af598380de4ee866192c19524d)), closes [#137](https://github.com/prisma/nexus-prisma/issues/137)
* **deps:** update dependency @reach/skip-nav to v0.18.0 ([#300](https://github.com/prisma/nexus-prisma/issues/300)) ([1ece744](https://github.com/prisma/nexus-prisma/commit/1ece7443fb261d3cfb95ea9393e451789a4ab625))
* **deps:** update dependency @types/node to v18.11.17 ([#324](https://github.com/prisma/nexus-prisma/issues/324)) ([86a6c4d](https://github.com/prisma/nexus-prisma/commit/86a6c4d732f6d7d605b46f8d8cb6077d05df2d4a))
* **deps:** update dependency debug to ^4.3.4 ([#289](https://github.com/prisma/nexus-prisma/issues/289)) ([53a5b47](https://github.com/prisma/nexus-prisma/commit/53a5b47c47e1760f245aa82fcf315935d7c50790))
* **deps:** update dependency decimal.js to ^10.4.2 ([#301](https://github.com/prisma/nexus-prisma/issues/301)) ([38d02f6](https://github.com/prisma/nexus-prisma/commit/38d02f65e14be6bb3657b94abf98181d86bb4061))
* **deps:** update dependency decimal.js to ^10.4.3 ([#325](https://github.com/prisma/nexus-prisma/issues/325)) ([21cea98](https://github.com/prisma/nexus-prisma/commit/21cea98ec1900ceed66f50385d1f17344ffd569c))
* **deps:** update dependency dotenv to ^9.0.2 ([#326](https://github.com/prisma/nexus-prisma/issues/326)) ([fca26b0](https://github.com/prisma/nexus-prisma/commit/fca26b08694e4d4398ac51c7a5f4928d585d1e10))
* **deps:** update dependency fs-jetpack to v5 ([#255](https://github.com/prisma/nexus-prisma/issues/255)) ([7fdb71c](https://github.com/prisma/nexus-prisma/commit/7fdb71c18a78e65d3fcc59c512ad8009a8947a84))
* **deps:** update dependency graphql-scalars to ^1.20.1 ([#302](https://github.com/prisma/nexus-prisma/issues/302)) ([38d47d6](https://github.com/prisma/nexus-prisma/commit/38d47d65a764ed6ae9732df1c7375b182b5ebafd))
* **deps:** update dependency kleur to ^4.1.5 ([#290](https://github.com/prisma/nexus-prisma/issues/290)) ([3c2310f](https://github.com/prisma/nexus-prisma/commit/3c2310f19ffcf1026f59f042c715c98950f0f573))
* **deps:** update dependency nextra to v2.0.0-beta.41 ([#273](https://github.com/prisma/nexus-prisma/issues/273)) ([a523891](https://github.com/prisma/nexus-prisma/commit/a523891aaad27b838280173f69f1519e8a717ef6))
* **deps:** update dependency nextra-theme-docs to v2.0.0-beta.41 ([#274](https://github.com/prisma/nexus-prisma/issues/274)) ([73f99bf](https://github.com/prisma/nexus-prisma/commit/73f99bf7da3bd8405fecf995ec227d9090c6c30a))
* **deps:** update dependency semver to ^7.3.8 ([#291](https://github.com/prisma/nexus-prisma/issues/291)) ([1cbfb25](https://github.com/prisma/nexus-prisma/commit/1cbfb25fd92c20e5b237da0662e2b6732463c34d))
* **deps:** update dependency tslib to ^2.4.1 ([#303](https://github.com/prisma/nexus-prisma/issues/303)) ([ec603b0](https://github.com/prisma/nexus-prisma/commit/ec603b0c66fb9b20c53b0a475c33cc676f916358))
* **deps:** update dependency typescript to v4.9.4 ([#251](https://github.com/prisma/nexus-prisma/issues/251)) ([bb3d9d7](https://github.com/prisma/nexus-prisma/commit/bb3d9d72ac09b61d4229031681df83da6fbfd569))
* **deps:** update nextra packages to v2.0.1 ([#316](https://github.com/prisma/nexus-prisma/issues/316)) ([f3923e2](https://github.com/prisma/nexus-prisma/commit/f3923e2c86d5c5396c7eab817a16e33d16105869))
* **deps:** update nextra packages to v2.0.2 ([#346](https://github.com/prisma/nexus-prisma/issues/346)) ([ee97081](https://github.com/prisma/nexus-prisma/commit/ee97081592d20a7036f175cd7baf26373e8ecd90))
* **deps:** update nextra packages to v2.0.3 ([#349](https://github.com/prisma/nexus-prisma/issues/349)) ([84170d1](https://github.com/prisma/nexus-prisma/commit/84170d16749388c3de3a53473f74d994c0bd9c8f))
* description type should not be null ([#24](https://github.com/prisma/nexus-prisma/issues/24)) ([cffc94d](https://github.com/prisma/nexus-prisma/commit/cffc94d43225ea3c68a818a6c45cd3b1a19691b1))
* **docs:** update custom settings example ([#215](https://github.com/prisma/nexus-prisma/issues/215)) ([8b56ec9](https://github.com/prisma/nexus-prisma/commit/8b56ec99a557cccb10c3bf09d89dfa30a82903ee))
* endent via dedent introduces unexpected newlines on Windows ([#51](https://github.com/prisma/nexus-prisma/issues/51)) ([2447f56](https://github.com/prisma/nexus-prisma/commit/2447f56bf7f1eb538a4411d8d8cfe9b9f4f1b714))
* graphql peerDependency ([#233](https://github.com/prisma/nexus-prisma/issues/233)) ([0086763](https://github.com/prisma/nexus-prisma/commit/00867632de1528b5149b06a29b930e20ccd57779))
* grpahql and floggy dependencies ([#188](https://github.com/prisma/nexus-prisma/issues/188)) ([774624f](https://github.com/prisma/nexus-prisma/commit/774624f3c85055f0094183f77f0fb19275eaee5b))
* handle multiline prisma docs ([#134](https://github.com/prisma/nexus-prisma/issues/134)) ([f9e2f2e](https://github.com/prisma/nexus-prisma/commit/f9e2f2e324ca10eed5c9d38b2802b25d36ca4524))
* import path on windows ([#145](https://github.com/prisma/nexus-prisma/issues/145)) ([4699b90](https://github.com/prisma/nexus-prisma/commit/4699b903148caedc8a309a795ef82d201badd03c))
* import prisma client for instanceof check using configured path ([#62](https://github.com/prisma/nexus-prisma/issues/62)) ([b796689](https://github.com/prisma/nexus-prisma/commit/b79668967b7e05f09ebdb3239936f86b93cc3c91))
* list def typing ([#77](https://github.com/prisma/nexus-prisma/issues/77)) ([72cc944](https://github.com/prisma/nexus-prisma/commit/72cc9445b55cc0caf85f9a1810aaedaed286afa3))
* module `fs-jetpack` not found ([#11](https://github.com/prisma/nexus-prisma/issues/11)) ([4f83b26](https://github.com/prisma/nexus-prisma/commit/4f83b26a00c39c0b757cee23ed97a077fe894b32))
* ncc support ([#113](https://github.com/prisma/nexus-prisma/issues/113)) ([9c7e552](https://github.com/prisma/nexus-prisma/commit/9c7e5520659481a91ab89c36532dfedabdbfecb5))
* output mjs files for ES modules support ([#192](https://github.com/prisma/nexus-prisma/issues/192)) ([cf59aae](https://github.com/prisma/nexus-prisma/commit/cf59aae05f87779164ed6dcef036fd885b3c8efe))
* remove bad prisma client on ctx check & export $settings ([#60](https://github.com/prisma/nexus-prisma/issues/60)) ([60a77cd](https://github.com/prisma/nexus-prisma/commit/60a77cdcbdf9f063f11cc8208bea279bfb0a6fd9))
* remove colors from the the result to fix the local test ([#225](https://github.com/prisma/nexus-prisma/issues/225)) ([684fa20](https://github.com/prisma/nexus-prisma/commit/684fa20d1e7124ddb3af5182f835937c61f75c7b))
* remove lingering console.log ([d16f763](https://github.com/prisma/nexus-prisma/commit/d16f76385e7b0c351c109676ee943b17382d72f9))
* resolve path ~ when checking if can import at @prisma/client ([#104](https://github.com/prisma/nexus-prisma/issues/104)) ([8eee072](https://github.com/prisma/nexus-prisma/commit/8eee0729ffda7275a941146112e265b3b4b6049b))
* scalars module only exports named exports ([#187](https://github.com/prisma/nexus-prisma/issues/187)) ([5223f9e](https://github.com/prisma/nexus-prisma/commit/5223f9e2d43ddf173ec1abca0e6e18b052893b54))
* setup nodejs 14 for publishing job on ci ([4cbb0de](https://github.com/prisma/nexus-prisma/commit/4cbb0de12f2cb9c4248a0810419f55e3073930ac))
* typegen guards for undefined relations ([#126](https://github.com/prisma/nexus-prisma/issues/126)) ([a27fc1a](https://github.com/prisma/nexus-prisma/commit/a27fc1a827fa15e7956e5ee111c11b5a2f75ead3))
* update prisma client dep to 3 ([#148](https://github.com/prisma/nexus-prisma/issues/148)) ([fa58349](https://github.com/prisma/nexus-prisma/commit/fa583495c37ca55f0cfb38b88ef51499fe500b45))
* use import id @prisma/client by default when possible ([#88](https://github.com/prisma/nexus-prisma/issues/88)) ([5599a65](https://github.com/prisma/nexus-prisma/commit/5599a6561c0cec835d1110f68a349bb3fc596f96))


### CI

* add pull request workflow documentation build commit status check ([#314](https://github.com/prisma/nexus-prisma/issues/314)) ([4522e1d](https://github.com/prisma/nexus-prisma/commit/4522e1d94f51df5ee29e384b58d26b531a237e85))
* configure renovate config to update only the lock file for prisma packages ([#344](https://github.com/prisma/nexus-prisma/issues/344)) ([3560a41](https://github.com/prisma/nexus-prisma/commit/3560a41c84e3caf375a9f0d2d3661a2e38d01724))
* configure renovate to automerge minor and patch chore(deps) ([#284](https://github.com/prisma/nexus-prisma/issues/284)) ([2022809](https://github.com/prisma/nexus-prisma/commit/20228099b16f3c16b81fac3257397acddf61319d))
* extract tests into reusable workflow and refactor releases ([#345](https://github.com/prisma/nexus-prisma/issues/345)) ([27e99a8](https://github.com/prisma/nexus-prisma/commit/27e99a8abc8901ec1eabab4f0d950d45e1b542e9))
* fix package version ([#317](https://github.com/prisma/nexus-prisma/issues/317)) ([4e02312](https://github.com/prisma/nexus-prisma/commit/4e02312bb4766dec5ba2f034badd4bf6a309c9e9))
* group nextra packages for renovate upgrades ([#315](https://github.com/prisma/nexus-prisma/issues/315)) ([21471e8](https://github.com/prisma/nexus-prisma/commit/21471e8b626812a76658aabe81b73fb6f305a9b9))
* ignore execa from renovate updates due exclusive esm support ([#337](https://github.com/prisma/nexus-prisma/issues/337)) ([99110c8](https://github.com/prisma/nexus-prisma/commit/99110c8164d354b1303938f897a6e1acdeee9526))
* refactor tests to use local database ([#311](https://github.com/prisma/nexus-prisma/issues/311)) ([7559995](https://github.com/prisma/nexus-prisma/commit/75599959f28635d8480afa5dab79b00d4d7a4bd7))
* reflect local database for tests in trunk github actions workflow ([#312](https://github.com/prisma/nexus-prisma/issues/312)) ([8bfd561](https://github.com/prisma/nexus-prisma/commit/8bfd561ea3618ec36559f1b771f253c968c1871e))
* switch dependencies into dev dependencies in tests ([#319](https://github.com/prisma/nexus-prisma/issues/319)) ([11ee750](https://github.com/prisma/nexus-prisma/commit/11ee7500e67875365a847de25c1293aa3f84c04c))
* unify trunk and pull request github actions workflow ([#313](https://github.com/prisma/nexus-prisma/issues/313)) ([6a73b25](https://github.com/prisma/nexus-prisma/commit/6a73b25de3243e2174b0ab8f285e54abbf306505))
* update renovate config to use version range to ignore packages migrated to pure esm ([#343](https://github.com/prisma/nexus-prisma/issues/343)) ([23ed616](https://github.com/prisma/nexus-prisma/commit/23ed616403d43d1bf0aae9ef200683d41df190b7))
