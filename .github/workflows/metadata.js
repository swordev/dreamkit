module.exports = async ({ core }) => {
  const output = {};
  const published = JSON.parse(process.env.PUBLISHED_PACKAGES);

  for (const { name, version } of published) {
    output[`${name}:version`] = version;
    output[`${name}:published`] =
      name === "@dreamkit/site" ? !version.includes("next") : true;
  }

  for (const name in output) {
    core.setOutput(name, output[name]);
  }

  console.log(output);
};
