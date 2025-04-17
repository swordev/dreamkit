# dreamkit

[![workflow-badge]](https://github.com/swordev/dreamkit/actions/workflows/ci.yaml) [![license-badge]](https://github.com/swordev/dreamkit#license)

[workflow-badge]: https://img.shields.io/github/actions/workflow/status/swordev/dreamkit/ci.yaml?branch=main
[license-badge]: https://img.shields.io/github/license/swordev/dreamkit

> The Solid.js dev kit you've always dreamed of.

## Notice

This project was created for [SolidHack 2024](https://hack.solidjs.com).

## Packages

| Name                            | Version                                                         | Description                                 |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| [dreamkit](./packages/dreamkit) | [![npm-badge-dreamkit]](https://www.npmjs.com/package/dreamkit) | Toolkit for building Solid/SolidStart apps. |

## Internal packages

| Name                                        | Version                                                                              | Description                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| [@dreamkit/app](./packages/app)             | [![npm-badge-dreamkit_app]](https://www.npmjs.com/package/@dreamkit/app)             | Set of utils to create applications.                   |
| [@dreamkit/dev](./packages/dev)             | [![npm-badge-dreamkit_dev]](https://www.npmjs.com/package/@dreamkit/dev)             | Development tools for DreamKit.                        |
| [@dreamkit/func](./packages/func)           | [![npm-badge-dreamkit_func]](https://www.npmjs.com/package/@dreamkit/func)           | Functions builder with IoC and input validation.       |
| [@dreamkit/ioc](./packages/ioc)             | [![npm-badge-dreamkit_ioc]](https://www.npmjs.com/package/@dreamkit/ioc)             | A simple and lightweight IoC container for TypeScript. |
| [@dreamkit/kind](./packages/kind)           | [![npm-badge-dreamkit_kind]](https://www.npmjs.com/package/@dreamkit/kind)           | Alternative to instanceof compatible with partial HMR. |
| [@dreamkit/node-app](./packages/node-app)   | [![npm-badge-dreamkit_node-app]](https://www.npmjs.com/package/@dreamkit/node-app)   | DreamKit application for Node.js.                      |
| [@dreamkit/schema](./packages/schema)       | [![npm-badge-dreamkit_schema]](https://www.npmjs.com/package/@dreamkit/schema)       | Validation and management of typed schemas.            |
| [@dreamkit/solid](./packages/solid)         | [![npm-badge-dreamkit_solid]](https://www.npmjs.com/package/@dreamkit/solid)         | DreamKit tools for Solid.                              |
| [@dreamkit/utils](./packages/utils)         | [![npm-badge-dreamkit_utils]](https://www.npmjs.com/package/@dreamkit/utils)         | A collection of utilities for DreamKit.                |
| [@dreamkit/workspace](./packages/workspace) | [![npm-badge-dreamkit_workspace]](https://www.npmjs.com/package/@dreamkit/workspace) | Tool for managing monorepos.                           |

[npm-badge-dreamkit]: https://img.shields.io/npm/v/dreamkit
[npm-badge-dreamkit_app]: https://img.shields.io/npm/v/@dreamkit/app
[npm-badge-dreamkit_dev]: https://img.shields.io/npm/v/@dreamkit/dev
[npm-badge-dreamkit_func]: https://img.shields.io/npm/v/@dreamkit/func
[npm-badge-dreamkit_ioc]: https://img.shields.io/npm/v/@dreamkit/ioc
[npm-badge-dreamkit_kind]: https://img.shields.io/npm/v/@dreamkit/kind
[npm-badge-dreamkit_node-app]: https://img.shields.io/npm/v/@dreamkit/node-app
[npm-badge-dreamkit_schema]: https://img.shields.io/npm/v/@dreamkit/schema
[npm-badge-dreamkit_solid]: https://img.shields.io/npm/v/@dreamkit/solid
[npm-badge-dreamkit_utils]: https://img.shields.io/npm/v/@dreamkit/utils
[npm-badge-dreamkit_workspace]: https://img.shields.io/npm/v/@dreamkit/workspace

## Installation

```sh
pnpm install dreamkit
```

## Resources

- [Documentation](https://next.dreamkit.dev/get-started)

## Development

### Requirements

- [Node.js v22](https://nodejs.org)
- [pnpm v9](https://pnpm.io)

### Startup

```sh
git clone https://github.com/swordev/dreamkit
cd dreamkit
git checkout next
pnpm install
pnpm watch

pnpm dev:site
# or
pnpm dev:solid-start-app
```

## License

Distributed under the MIT License. See LICENSE file in each package for more information.
