// title: Basic usage
import { $route, Link, s } from "dreamkit";

export const sectionRoute = $route
  .path("/section")
  .params({ name: s.string() })
  .create(({ params }) => (
    <>
      <p>section: {params.name}</p>
      {/* @ts-expect-error */}
      <Link href="/">Go to home</Link>
    </>
  ));

export default $route.path("/").create(() => (
  <>
    {/* @ts-expect-error */}
    <Link href="/section" params={{ name: "one" }}>
      Go to section one
    </Link>
  </>
));
