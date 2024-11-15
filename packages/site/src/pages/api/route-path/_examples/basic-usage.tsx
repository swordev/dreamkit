// title: Basic usage
import { $route, routePath, s } from "dreamkit";

export const userRoute = $route
  .params({ id: s.number() })
  .path(({ id }) => `/user/${id}`)
  .create(({ params }) => <>id: {params.id}</>);

export default $route.path("/").create(() => {
  // @ts-expect-error
  return <a href={routePath("/user/:id", { id: 1 })}>User 1</a>;
});
