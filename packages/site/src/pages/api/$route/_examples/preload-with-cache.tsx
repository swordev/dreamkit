// title: Preload with cache
import { $api, $route, Link, s } from "dreamkit";
import { createResource } from "solid-js";

const fetchData = $api
  .cache("users")
  .params({ id: s.number() })
  .create(({ id }) => {
    console.log("Fetching data", id);
    return Date.now();
  });

export const userRoute = $route
  .params(fetchData.params)
  .path(({ id }) => `/user/${id}`)
  .api({ fetchData })
  .preload(({ api, params }) => api.fetchData(params))
  .create(({ data }) => {
    const [res] = createResource(() => data);
    return <>{res()}</>;
  });

export default $route.path("/").create(() => (
  <>
    {/* @ts-ignore */}
    <Link href="/user/:id" params={{ id: 1 }}>
      user 1
    </Link>
    <br />
    {/* @ts-ignore */}
    <Link href="/user/:id" params={{ id: 2 }}>
      user 2
    </Link>
  </>
));
