import Database from "better-sqlite3";
import {
  $api,
  $route,
  type InferType,
  Input,
  IocContext,
  s,
  ServiceClass,
} from "dreamkit";
import { createResource, For } from "solid-js";

const userSchema = s.object({
  id: s.number().integer().min(1),
  name: s.string(),
});

export class SqlService extends ServiceClass({
  IocContext,
}) {
  onStart() {
    const db = new Database(":memory:");
    db.exec("CREATE TABLE users (id INTEGER, name TEXT)");
    const insert = db.prepare("INSERT INTO users (id, name) VALUES (?, ?)");
    for (let id = 1; id <= 10; id++) insert.run([id, `User ${id}`]);
    this.iocContext.register(Database, { value: db });
    return () => {
      db.close();
      this.iocContext.unregister(Database);
    };
  }
}

export const fetchUsers = $api
  .self({ Database })
  .params(userSchema.pick({ name: true }).deepPartial())
  .create(function (filter) {
    return this.database
      .prepare<
        [string],
        InferType<typeof userSchema>
      >(`SELECT * FROM users WHERE name LIKE CONCAT('%', ?, '%')`)
      .all(filter.name ?? "");
  });

export default $route
  .api({ fetchUsers })
  .params(fetchUsers.params)
  .path("/")
  .create(({ api, params, setParams }) => {
    const [users] = createResource(() => ({ ...params }), api.fetchUsers);
    return (
      <>
        <Input
          value={params.name ?? ""}
          onChange={(value) => setParams({ name: value || undefined })}
        />
        <ul>
          <For each={users.latest}>
            {(user) => (
              <li>
                {user.id}. {user.name}
              </li>
            )}
          </For>
        </ul>
      </>
    );
  });
