## [2.0.10](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.9...v2.0.10) (2025-08-06)


### Bug Fixes

* TranscribeFileResponse structure ([b2ad32b](https://github.com/aiola-lab/aiola-js-sdk/commit/b2ad32bbf905c23721aefa5e81e34a77af9dc1aa))

## [2.0.9](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.8...v2.0.9) (2025-07-31)


### Bug Fixes

* check buffer type ([8afea50](https://github.com/aiola-lab/aiola-js-sdk/commit/8afea509edead9cc985d19c4a2d852482e1450cc))

## [2.0.8](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.7...v2.0.8) (2025-07-31)


### Bug Fixes

* browser example ([#36](https://github.com/aiola-lab/aiola-js-sdk/issues/36)) ([8823a01](https://github.com/aiola-lab/aiola-js-sdk/commit/8823a0156b32a8948a2b4dd751a7dda34789445b))

## [2.0.7](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.6...v2.0.7) (2025-07-27)


### Bug Fixes

* update transcribeFile function to include file existence check and improve error handling ([#34](https://github.com/aiola-lab/aiola-js-sdk/issues/34)) ([9c66515](https://github.com/aiola-lab/aiola-js-sdk/commit/9c665151abb1802392842f54c4d6ab9447e80695))

## [2.0.6](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.5...v2.0.6) (2025-07-24)


### Bug Fixes

* transcribeFile headers. Readme update with stt keywords param and supported langs ([#33](https://github.com/aiola-lab/aiola-js-sdk/issues/33)) ([ae4334a](https://github.com/aiola-lab/aiola-js-sdk/commit/ae4334ad0c7748316713e8c4e96c543cdb4af83d))

## [2.0.5](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.4...v2.0.5) (2025-07-16)


### Bug Fixes

* dist location ([fe00f38](https://github.com/aiola-lab/aiola-js-sdk/commit/fe00f38b51add2cd727c25fbaae87e006703c8e1))
* set keywords ([6416231](https://github.com/aiola-lab/aiola-js-sdk/commit/6416231fd7f4039eabb85c86d697d3cded5f9557))

## [2.0.4](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.3...v2.0.4) (2025-07-16)


### Bug Fixes

* docs ([a5856b0](https://github.com/aiola-lab/aiola-js-sdk/commit/a5856b0741957274c1876daac793ae001e2e4b80))
* stream chunk size ([c883983](https://github.com/aiola-lab/aiola-js-sdk/commit/c88398383b91f38a3edaa9a630268097d70a6f64))

## [2.0.3](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.2...v2.0.3) (2025-07-15)


### Bug Fixes

* base urls ([c1d6184](https://github.com/aiola-lab/aiola-js-sdk/commit/c1d61844d3cd9340cbbed845c62d027e2aaf39da))

## [2.0.2](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.1...v2.0.2) (2025-07-15)


### Bug Fixes

* examples ([519f39c](https://github.com/aiola-lab/aiola-js-sdk/commit/519f39c4d51ce446935e4ef2e694222b9391644d))

## [2.0.1](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.0...v2.0.1) (2025-07-15)


### Bug Fixes

* examples ([7580f21](https://github.com/aiola-lab/aiola-js-sdk/commit/7580f21751da730a767420dd4e81b52fc9b077da))

# [2.0.0](https://github.com/aiola-lab/aiola-js-sdk/compare/v1.0.3...v2.0.0) (2025-07-15)


### Bug Fixes

* version bump ([2ba16e6](https://github.com/aiola-lab/aiola-js-sdk/commit/2ba16e604b6665db61a1cb9e00061845cbee2157))


### Code Refactoring

* simplify authentication by removing TokenManager ([1d79878](https://github.com/aiola-lab/aiola-js-sdk/commit/1d798782e3b6bca43e28d81fe02ae1be80704b6e))


### BREAKING CHANGES

* Users must now generate access tokens using AiolaClient.grantToken()
and initialize the client with the access token directly.

## [2.0.1](https://github.com/aiola-lab/aiola-js-sdk/compare/v2.0.0...v2.0.1) (2025-07-15)


### Bug Fixes

* version bump ([2ba16e6](https://github.com/aiola-lab/aiola-js-sdk/commit/2ba16e604b6665db61a1cb9e00061845cbee2157))

# [2.0.0](https://github.com/aiola-lab/aiola-js-sdk/compare/v1.0.3...v2.0.0) (2025-07-15)


### Code Refactoring

* simplify authentication by removing TokenManager ([1d79878](https://github.com/aiola-lab/aiola-js-sdk/commit/1d798782e3b6bca43e28d81fe02ae1be80704b6e))


### BREAKING CHANGES

* Users must now generate access tokens using AiolaClient.grantToken()
and initialize the client with the access token directly.

## [1.0.3](https://github.com/aiola-lab/aiola-js-sdk/compare/v1.0.2...v1.0.3) (2025-07-09)


### Bug Fixes

* default workflow_id ([bc8324a](https://github.com/aiola-lab/aiola-js-sdk/commit/bc8324a8e46286c0b2bbf923306011e635a977bb))
* test ([7ea22ee](https://github.com/aiola-lab/aiola-js-sdk/commit/7ea22ee5982b550714f3c8270e9a19ce888cd9e4))

## [1.0.2](https://github.com/aiola-lab/aiola-js-sdk/compare/v1.0.1...v1.0.2) (2025-07-09)


### Bug Fixes

* example ([d10e864](https://github.com/aiola-lab/aiola-js-sdk/commit/d10e864f80297d05a16439fb56d5481ee161c986))

## [1.0.1](https://github.com/aiola-lab/aiola-js-sdk/compare/v1.0.0...v1.0.1) (2025-07-09)


### Bug Fixes

* base urls ([580f09c](https://github.com/aiola-lab/aiola-js-sdk/commit/580f09c6d2466dd1a80938b1b444338e6c66db2e))

# 1.0.0 (2025-07-09)


### Bug Fixes

* Update GitHub Actions workflow to use new token ([#11](https://github.com/aiola-lab/aiola-js-sdk/issues/11)) ([2b742e4](https://github.com/aiola-lab/aiola-js-sdk/commit/2b742e430da5d6a17aee52584c692dc4efd306a5))


### Features

* Add release automation and documentation ([#10](https://github.com/aiola-lab/aiola-js-sdk/issues/10)) ([06f5ac9](https://github.com/aiola-lab/aiola-js-sdk/commit/06f5ac98bb9761dc506eff2d34bd172be684ba78))
* unified sdk ([be84bcc](https://github.com/aiola-lab/aiola-js-sdk/commit/be84bcc729b280513b1757d1045ec5a5e97ed57a))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
