// title: Basic usage
import { $api, $route, $settings, s } from "dreamkit";
import { createResource } from "solid-js";

export const AppSettings = $settings
  .name("app")
  .params({ name: s.string() })
  // generates default values (optional)
  .generate((input) => ({
    ...(!input.name && { name: "My App" }),
  }))
  .create();

const fetchAppSettings = $api.self({ AppSettings }).create(function () {
  return this.appSettings.params;
});

export default $route
  .path("/")
  .api({ fetchAppSettings })
  .create(({ api }) => {
    const [data] = createResource(api.fetchAppSettings);
    return <>{data.latest?.name}</>;
  });
