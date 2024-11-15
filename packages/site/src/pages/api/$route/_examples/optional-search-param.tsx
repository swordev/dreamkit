// title: Optional path params
import { $route, Link, s } from "dreamkit";

export const homeRoute = $route.path("/").create(() => (
  <>
    {/* @ts-expect-error */}
    <Link href="/section">link without params</Link>
    <br />
    {/* @ts-expect-error */}
    <Link href="/section" params={{ name: "test" }}>
      link with params
    </Link>
  </>
));

export const sectionRoute = $route
  .path("/section")
  .params({ name: s.string().optional() })
  .create(({ params }) => <>name: {params.name}</>);
