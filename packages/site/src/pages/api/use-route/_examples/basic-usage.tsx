// fileName: src/routes/[id].tsx
import { $route, useRoute, s, Link } from "dreamkit";

export const route = $route.params({
  id: s.number().optional(),
});

export default function Home() {
  const { params } = useRoute(route);
  return (
    <>
      {/* @ts-ignore */}
      <Link href="/" params={{ id: 1 }}>
        id: 1
      </Link>
      <br />
      {/* @ts-ignore */}
      <Link href="/">id: undefined</Link>
      <br />
      <div>id: {params.id}</div>
    </>
  );
}
