// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration
const packageJson = require('./package.json')
process.env.SNOWPACK_PUBLIC_PACKAGE_VERSION = packageJson.version

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    src: '/',
  },
  workspaceRoot: '../../',
  packageOptions: {
    polyfillNode: true,
  },
  plugins: [
    '@snowpack/plugin-sass',
    ['@snowpack/plugin-typescript', { tsc: 'yarn tsc' }],
    [
      'snowpack-plugin-replace',
      {
        // Handle incorrect uuid imports in aws-sdk (via bids-validator)
        list: [{ from: '{ v4 } from "uuid"', to: 'v4 from "uuid"' }],
      },
    ],
  ],
  devOptions: {
    port: 9876,
  },
}
