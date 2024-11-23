// title: Basic usage
import { $route, $middleware, RequestUrl, Link } from "dreamkit";

export class AppMiddleware extends $middleware.self({ RequestUrl }).create() {
  onRequest() {
    // @ts-expect-error
    if (this.requestUrl.is("/section")) {
      console.log("hello from other section");
    } else if (this.requestUrl.pathname === "/ping") {
      return new Response("pong");
    }
  }
}

export const homeRoute = $route.path("/").create(() => {
  return (
    <>
      {/* @ts-expect-error */}
      <Link href="/section">Go to section</Link>
    </>
  );
});

export const sectionRoute = $route.path("/section").create(() => {
  return (
    <>
      <button onClick={() => location.reload()}>
        Click here to reload and call to the middleware
      </button>
      <br />
      <a href="/ping" target="_blank">
        Go to ping
      </a>
    </>
  );
});
