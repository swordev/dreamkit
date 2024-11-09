# dreamkit

[![workflow-badge]](https://github.com/swordev/dreamkit/actions/workflows/ci.yaml) [![license-badge]](https://github.com/swordev/dreamkit#license)

[workflow-badge]: https://img.shields.io/github/actions/workflow/status/swordev/dreamkit/ci.yaml?branch=main
[license-badge]: https://img.shields.io/github/license/swordev/dreamkit

> The Solid.js dev kit you've always dreamed of.

## Packages

| Name                                  | Version                                                          | Description                                            |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| [dreamkit](./packages/dreamkit)       | [![npm-badge-0]](https://www.npmjs.com/package/dreamkit)         | Toolkit for building Solid/SolidStart apps.            |
| [@dreamkit/app](./packages/app)       | [![npm-badge-1]](https://www.npmjs.com/package/@dreamkit/app)    | Set of utils to create applications.                   |
| [@dreamkit/dev](./packages/dev)       | [![npm-badge-2]](https://www.npmjs.com/package/@dreamkit/dev)    | Development tools for DreamKit.                        |
| [@dreamkit/kind](./packages/kind)     | [![npm-badge-3]](https://www.npmjs.com/package/@dreamkit/kind)   | Alternative to instanceof compatible with partial HMR. |
| [@dreamkit/schema](./packages/schema) | [![npm-badge-4]](https://www.npmjs.com/package/@dreamkit/schema) | Validation and management of typed schemas.            |
| [@dreamkit/solid](./packages/solid)   | [![npm-badge-5]](https://www.npmjs.com/package/@dreamkit/solid)  | DreamKit tools for Solid.                              |
| [@dreamkit/utils](./packages/utils)   | [![npm-badge-6]](https://www.npmjs.com/package/@dreamkit/utils)  | A collection of utilities for DreamKit.                |

[npm-badge-0]: https://img.shields.io/npm/v/dreamkit
[npm-badge-1]: https://img.shields.io/npm/v/@dreamkit/app
[npm-badge-2]: https://img.shields.io/npm/v/@dreamkit/dev
[npm-badge-3]: https://img.shields.io/npm/v/@dreamkit/kind
[npm-badge-4]: https://img.shields.io/npm/v/@dreamkit/schema
[npm-badge-5]: https://img.shields.io/npm/v/@dreamkit/solid
[npm-badge-6]: https://img.shields.io/npm/v/@dreamkit/utils

## Installation

```sh
pnpm install dreamkit
```

## Resources

- [Documentation](https://dreamkit.dev)

## Development

### Requirements

- [Node.js v22](https://nodejs.org)
- [pnpm v9](https://pnpm.io)

### Startup

```sh
git clone https://github.com/swordev/dreamkit
cd dreamkit
pnpm install
pnpm watch
```

## License

Distributed under the MIT License. See LICENSE file in each package for more information.
