import { s, $route } from "dreamkit";
import { createResource, For } from "solid-js";

const items = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
}));

export default $route
  .params({ name: s.string().optional() })
  .create(({ params, setParams }) => {
    const [resource] = createResource(
      () => ({ name: params.name?.toLowerCase() }),
      (search) =>
        items.filter(
          (item) =>
            !search.name || !item.name.toLowerCase().includes(search.name),
        ),
    );
    return (
      <div>
        <input
          type="text"
          placeholder="name"
          value={params.name ?? ""}
          onInput={(event) => {
            setParams({ ...params, name: event.target.value || undefined });
          }}
        />
        <ul>
          <For each={resource()}>{(item) => <li>{item.name}</li>}</For>
        </ul>
      </div>
    );
  });
