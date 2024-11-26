// title: Basic usage
import { $middleware, $route, Link, RequestUrl, s } from "dreamkit";

export class MyMiddleware extends $middleware.self({ RequestUrl }).create() {
  onRequest() {
    // @ts-expect-error
    if (this.requestUrl.is("/user/:id")) {
      console.log("User route!");
    }
  }
}
export const userRoute = $route
  .params({ id: s.number() })
  .path(({ id }) => `/user/${id}`)
  .create(({ params }) => <>id: {params.id}</>);

export default $route.path("/").create(() => {
  return (
    // @ts-expect-error
    <Link href="/user/:id" params={{ id: 1 }}>
      User 1
    </Link>
  );
});
