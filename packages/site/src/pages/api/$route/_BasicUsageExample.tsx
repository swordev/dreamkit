// src/routes/users/[id].tsx
import { $route, s } from "dreamkit";

export default $route
  .params({
    name: s.string().optional(),
  })
  .create(({ params }) => {
    return (
      <ul>
        <li>name: {params.name}</li>
      </ul>
    );
  });
