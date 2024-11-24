// title: Auth
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
import { createEffect, createResource, createSignal, Show } from "solid-js";

class UserSession extends $session
  .name("user")
  .params({ id: s.number() })
  .create() {}

const login = $api
  .title("Login")
  .params({
    name: s.title("Name").string(),
    password: s.title("Password").string(),
  })
  .self({ SessionHandler })
  .create(async function (params) {
    if (params.name === "admin" && params.password === "admin") {
      await this.sessionHandler.set(UserSession, { id: 1 });
    } else {
      throw new Error("Invalid auth");
    }
  });

const logout = $api
  .title("Logout")
  .self({ SessionHandler })
  .create(async function () {
    await this.sessionHandler.unset(UserSession);
  });

const fetchSessionData = $api
  .title("Try fetch session params")
  .self({ UserSession })
  .create(async function () {
    return { id: this.userSession.params.id };
  });

const checkAuth = $api
  .title("Check auth")
  .self({ UserSession: iocParam(UserSession).optional() })
  .create(function () {
    return !!this.userSession;
  });

export default $route
  .api({ login, logout, fetchSessionData, checkAuth })
  .params({ name: login.params.name.optional() })
  .path("/")
  .create(({ api, params }) => {
    const [name, setName] = createSignal(params.name ?? "");
    const [password, setPassword] = createSignal("");
    const logout = createAction(api.logout);
    const fetchSessionData = createAction(api.fetchSessionData);
    const [checkAuth, { refetch }] = createResource(api.checkAuth);
    const login = createAction(api.login).with(() => ({
      name: name(),
      password: password(),
    }));
    createEffect(() => logout.state && refetch());
    createEffect(() => {
      if (login.state === "success") {
        refetch();
        setName("");
        setPassword("");
      }
    });
    return (
      <>
        <p>checkAuth: {checkAuth.latest ? "true" : "false"}</p>
        <p>
          <button
            onClick={fetchSessionData}
            disabled={fetchSessionData.running}
            children={fetchSessionData.title}
          />{" "}
          {fetchSessionData.error
            ? fetchSessionData.error.message
            : fetchSessionData.result
              ? JSON.stringify(fetchSessionData.result)
              : undefined}
        </p>
        <Show when={checkAuth.latest === true}>
          <button
            onClick={logout}
            disabled={logout.running}
            children={logout.title}
          />
        </Show>
        <Show when={checkAuth.latest === false}>
          <Input
            placeholder={login.params.name.options.title}
            value={name}
            onChange={setName}
          />
          <Input
            type="password"
            placeholder={login.params.password.options.title}
            value={password}
            onChange={setPassword}
          />
          <button
            type="submit"
            onClick={login}
            disabled={login.running}
            children={login.title}
          />
          {login.error?.message}
        </Show>
      </>
    );
  });
