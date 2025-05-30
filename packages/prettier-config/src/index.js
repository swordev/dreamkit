/**
 * @type {import("prettier").Config}
 */
module.exports = {
  endOfLine: "lf",
  importOrderParserPlugins: ["typescript", "jsx", "explicitResourceManagement"],
  plugins: [
    require.resolve("@trivago/prettier-plugin-sort-imports"),
    require.resolve("prettier-plugin-sort-json"),
    // https://github.com/matzkoh/prettier-plugin-packagejson/issues/225#issuecomment-2879629267
    // require.resolve("prettier-plugin-packagejson"),
  ],
};
