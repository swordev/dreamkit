// title: Basic usage
import { $route, Link, s } from "dreamkit";

export const otherRoute = $route
  .path("/other")
  .params({ value: s.string() })
  .create(({ params }) => (
    <>
      <p>{params.value}</p>
      {/* @ts-expect-error */}
      <Link href="/">Go to home</Link>
    </>
  ));

export default $route.path("/").create(() => (
  <>
    {/* @ts-expect-error */}
    <Link href="/other" params={{ value: 1 }}>
      Go to other
    </Link>
  </>
));
