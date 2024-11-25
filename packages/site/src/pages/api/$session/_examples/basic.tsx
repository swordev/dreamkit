// title: Basic usage
import {
  $api,
  $route,
  $session,
  createAction,
  Input,
  iocParam,
  s,
  SessionHandler,
} from "dreamkit";
import { createResource, createSignal } from "solid-js";

class ClientSession extends $session
  .name("client")
  .params({ locale: s.title("Locale").string() })
  .create() {}

const set = $api
  .title("Set")
  .params(ClientSession.params)
  .self({ SessionHandler })
  .create(async function (params) {
    console.log(params);
    await this.sessionHandler.set(ClientSession, params);
  });

const unset = $api
  .title("Unset")
  .self({ SessionHandler })
  .create(async function () {
    await this.sessionHandler.unset(ClientSession);
  });

const get = $api
  .title("Get")
  .self({ ClientSession: iocParam(ClientSession).optional() })
  .create(function () {
    return this.clientSession?.params;
  });

export default $route
  .api({ set, unset, get })
  .path("/")
  .create(({ api }) => {
    const [locale, setLocale] = createSignal("");
    const set = createAction(api.set).with(() => ({ locale: locale() }));
    const unset = createAction(api.unset);
    const [get, { refetch }] = createResource(api.get);
    return (
      <>
        <Input
          placeholder={set.params.locale.options.title}
          value={locale}
          onChange={setLocale}
        />
        <p>
          <button onClick={set} disabled={set.running} children={set.title} />
          <button
            onClick={unset}
            disabled={unset.running}
            children={unset.title}
          />
          <button
            onClick={refetch}
            disabled={get.loading}
            children={
              <>
                {api.get.title}: {JSON.stringify(get.latest)}
              </>
            }
          />
        </p>
      </>
    );
  });
