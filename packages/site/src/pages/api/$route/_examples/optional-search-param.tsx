// title: Optional path params
import { $route, Link, s } from "dreamkit";

export const homeRoute = $route.path("/").create(() => (
  <>
    {/* @ts-expect-error */}
    <Link href="/section">section</Link>
    {/* @ts-expect-error */}
    <Link href="/section" params={{ name: "test" }}>
      section with params
    </Link>
  </>
));

export const sectionRoute = $route
  .path("/section")
  .params({ name: s.string().optional() })
  .create(({ params }) => {
    return (
      <ul>
        <li>name: {params.name}</li>
      </ul>
    );
  });
