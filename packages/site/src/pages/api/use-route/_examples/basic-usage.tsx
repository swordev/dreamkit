// fileName: src/routes/[id].tsx
import { $route, useRoute, s, Link } from "dreamkit";

export const route = $route.params({
  id: s.number().optional(),
});

export default function User() {
  const { params } = useRoute(route);
  return (
    <ul>
      {/* @ts-ignore */}
      <Link href="/" id={{ id: 1 }}>
        id: 1
      </Link>
      {/* @ts-ignore */}
      <Link href="/">id: undefined</Link>
      <li>id: {params.id}</li>
    </ul>
  );
}
