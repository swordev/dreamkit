/**
 * @type {import("prettier").Config}
 */
module.exports = {
  endOfLine: "lf",
  importOrderParserPlugins: ["typescript", "jsx", "explicitResourceManagement"],
  plugins: [
    require.resolve("@trivago/prettier-plugin-sort-imports"),
    require.resolve("prettier-plugin-sort-json"),
    require.resolve("prettier-plugin-packagejson"),
  ],
};
