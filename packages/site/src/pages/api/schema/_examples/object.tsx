// title: Object manipulation
import { $route, ObjectType, s } from "dreamkit";
import { createSignal, For } from "solid-js";

const object = s
  .object({
    id: s.number().integer().min(1),
  })
  .assign({
    profile: { name: s.string() },
  });

const schemas: Record<string, ObjectType<{}>> = {
  // { id: number }
  pickOnlyId: object.pick({ id: true }),
  // { id?: number, profile?: { name?: string } }
  deepPartial: object.deepPartial(),
  // { id?: number | null, profile?: { name?: string | null } | null }
  deepNullish: object.deepNullish(),
  // { profile: { name: string, age?: number } }
  assign: object
    .assign({ profile: { age: s.number().optional() } })
    .pick({ profile: true }),
  // { id: number, profile: {}}
  omitName: object.omit({ profile: { name: true } }),
};

export default $route.path("/schema").create(() => {
  const [schema, setSchema] = createSignal("pickOnlyId");
  const [json, setJson] = createSignal(JSON.stringify({ id: 1 }, null, 2));
  const errors = () => {
    let subject;
    try {
      subject = JSON.parse(json());
    } catch {
      subject = {};
    }
    return schemas[schema()].validate(subject);
  };
  return (
    <>
      Schema:{" "}
      <select onInput={(event) => setSchema(event.target.value)}>
        <For each={Object.keys(schemas)}>
          {(value) => <option>{value}</option>}
        </For>
      </select>
      <p>
        JSON Schema: <br />
        <textarea
          style={{ height: "300px", width: "100%" }}
          disabled
          onInput={(event) => setJson(event.target.value)}
        >
          {JSON.stringify(schemas[schema()].toJsonSchema(), null, 2)}
        </textarea>
      </p>
      <p>
        Input:
        <br />
        <textarea
          style={{ height: "300px", width: "100%" }}
          onInput={(event) => setJson(event.target.value)}
        >
          {json()}
        </textarea>
      </p>
      <p>Errors: {JSON.stringify(errors(), null, 2)}</p>
    </>
  );
});
