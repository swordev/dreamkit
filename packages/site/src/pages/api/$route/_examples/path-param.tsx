// title: Path param
import { $route, Link, s } from "dreamkit";

export const homeRoute = $route.path("/").create(() => (
  <>
    {/* @ts-expect-error */}
    <Link href="/user/:id" params={{ id: 1 }}>
      user 1
    </Link>
    <br />
    {/* @ts-expect-error */}
    <Link href="/user/:id" params={{ id: 2 }}>
      user 2
    </Link>
  </>
));

export const userRoute = $route
  .params({ id: s.number() })
  .path((params) => `/user/${params.id}`)
  .create(({ params }) => <>id: {params.id}</>);
