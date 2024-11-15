// @ts-nocheck
import { $api, $route, s, SettingsClass } from "dreamkit";
import { createResource } from "solid-js";

// At startup 'settings.json' is loaded and the 'app' settings are fetched.
// Also 'settings.schema.json' is generated for autocomplete and validation.

export class AppSettings extends SettingsClass({
  name: "app",
  params: {
    name: s.string(),
  },
  defaults: () => ({
    name: "My App",
  }),
}) {}

const fetchSettings = $api.self({ AppSettings }).create(function () {
  return {
    app: this.appSettings.data.name,
  };
});

export default $route
  .path("/")
  .api({ fetchSettings })
  .create(({ api }) => {
    const settings = createResource(api.fetchSettings);
    return <>{JSON.stringify(settings)}</>;
  });
