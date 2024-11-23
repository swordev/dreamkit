// @ts-nocheck
import {
  s,
  SessionHandler,
  iocParam,
  RequestUrl,
  SessionClass,
  $middleware,
  Input,
  $api,
  $route,
  createAction,
} from "dreamkit";
import { createSignal, createResource } from "solid-js";

export class UserSession extends SessionClass({
  name: "user",
  props: { id: s.number() },
}) {}

export const logout = $api.self({ SessionHandler }).create(function () {
  this.sessionHander.remove(UserSession);
  return Response.redirect("/");
});

export const login = $api
  .title("Login")
  .self({ SessionHandler })
  .params({ user: s.string(), password: s.string() })
  .create(async (params) => {
    if (params.user === "admin" && params.password === "admin") {
      await this.sessionHandler.set(UserSession, { id: 1 });
      return Response.redirect("/");
    } else {
      throw new Error("Invalid auth");
    }
  });

export const fetchUserData = $api
  .self({
    UserSession,
  })
  .create(function () {
    return { id: this.userSession.data.id };
  });

export class AuthMiddleware extends $middleware
  .self({
    RequestUrl,
    UserSession: iocParam(UserSession).optional(),
  })
  .create() {
  override onRequest() {
    if (this.userSession) {
      if (this.requestUrl.is("/", "/login")) {
        return Response.redirect("/panel");
      }
    } else if (!this.requestUrl.is("/")) {
      return Response.redirect("/login");
    }
  }
}

export const loginRoute = $route
  .api({ login })
  .path("/login")
  .params({ user: s.string().optional() })
  .create(function ({ params, api }) {
    const [user, setUser] = createSignal(params.user ?? "");
    const [password, setPassword] = createSignal("");
    const login = createAction(api.login).with(() => ({
      user: user(),
      password: password(),
    }));
    return (
      <>
        <Input placeholder="user" value={user} onChange={setUser} />
        <Input placeholder="password" value={password} onChange={setPassword} />
        <button onClick={login} disabled={login.running}>
          login
        </button>
      </>
    );
  });

export const panelRoute = $route
  .api({ fetchUserData, logout })
  .path("/panel")
  .create(function ({ api }) {
    const logout = createAction(api.logout);
    const [userData] = createResource(api.fetchUserData);
    return (
      <>
        <button onClick={logout} disabled={logout.running}>
          logout
        </button>
        user id: {userData()?.id}
      </>
    );
  });
