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
  plugins: ['@snowpack/plugin-sass', '@snowpack/plugin-typescript'],
  devOptions: {
    port: 9876,
  },
}
