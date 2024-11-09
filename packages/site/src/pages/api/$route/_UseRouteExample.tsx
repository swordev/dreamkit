// src/routes/users/[id].tsx
import { $route, useRoute, s } from "dreamkit";

export const route = $route.params({
  name: s.string().optional(),
});

export default function User() {
  const { params } = useRoute(route);
  return (
    <ul>
      <li>name: {params.name}</li>
    </ul>
  );
}
