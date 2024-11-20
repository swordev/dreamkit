// title: Update settings
import {
  $api,
  $route,
  $settings,
  createAction,
  Input,
  s,
  SettingsHandler,
} from "dreamkit";
import { createEffect, createResource, createSignal } from "solid-js";

export const AppSettings = $settings
  .name("app")
  .params({ name: s.title("App name").string().min(1) })
  .generate((input) => ({ ...(!input.name && { name: "My App" }) }))
  .create();

const fetchSettings = $api.self({ AppSettings }).create(function () {
  return this.appSettings.params;
});

const updateSettings = $api
  .title("Update settings")
  .self({ SettingsHandler })
  .params(AppSettings.params)
  .create(async function (params) {
    await this.settingsHandler.set(AppSettings, params);
  });

export default $route
  .path("/")
  .api({ fetchSettings, updateSettings })
  .create(({ api }) => {
    const [name, setName] = createSignal("");
    const [settings, { refetch }] = createResource(api.fetchSettings);
    const updateSettings = createAction(api.updateSettings).with(() => ({
      name: name(),
    }));

    createEffect(() => {
      if (updateSettings.state === "success") {
        updateSettings.clear();
        setName("");
        refetch();
      }
    });
    return (
      <>
        <p>settings.json</p>
        <textarea disabled>{JSON.stringify(settings.latest)}</textarea>
        {updateSettings.error && (
          <p>{updateSettings.error.message.toString()}</p>
        )}
        <p>
          <Input
            placeholder={updateSettings.params.name.options.title}
            value={name}
            onChange={setName}
          />{" "}
          <button
            onClick={updateSettings}
            disabled={updateSettings.running}
            children={updateSettings.title}
          />
        </p>
      </>
    );
  });
