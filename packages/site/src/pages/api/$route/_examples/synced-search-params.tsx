// title: Synced search params
import { type InferObjectProps, Input, $route, s } from "dreamkit";
import { createResource, For } from "solid-js";

const users = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  country: { code: ["US", "ES"][i % 2] },
}));

const params = {
  id: s.number().optional(),
  name: s.string().optional(),
  country: s
    .object({
      code: s.string().optional(),
    })
    .optional(),
};

function fetchUsers(input: InferObjectProps<typeof params>) {
  const name =
    typeof input.name === "string" ? input.name.toLowerCase() : undefined;
  return users.filter((user) => {
    if (input.id !== undefined && user.id !== input.id) return false;
    if (name && !user.name.toLowerCase().includes(name)) return false;
    if (
      input.country?.code !== undefined &&
      user.country.code !== input.country.code
    )
      return false;
    return true;
  });
}

export default $route
  .path("/")
  .params(params)
  .onParamsError({ value: { id: 1 } })
  .create(({ params, setParams }) => {
    const [users] = createResource(
      () => ({ ...params, country: { ...params.country } }),
      fetchUsers,
    );

    return (
      <div>
        <form>
          <Input
            value={params.name ?? ""}
            onChange={(name) =>
              setParams({ ...params, name: name || undefined })
            }
          />
          <Input
            value={params.country?.code ?? ""}
            onChange={(code) =>
              setParams({
                ...params,
                country: { ...params.country, code: code || undefined },
              })
            }
          />
        </form>
        <ul>
          <For each={users()} fallback={<li>No results</li>}>
            {(user) => (
              <li>
                {user.id}. {user.name} ({user.country.code})
              </li>
            )}
          </For>
        </ul>
      </div>
    );
  });
