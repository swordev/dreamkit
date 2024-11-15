// title: Synced search params
import { Input, $route, s } from "dreamkit";

export default $route
  .path("/")
  .params(
    s
      .object({
        name: s.string(),
        country: s.object({
          code: s.string(),
        }),
      })
      .deepPartial(),
  )
  .create(({ params, setParams }) => {
    return (
      <>
        <i>Look at the address bar of your browser.</i>
        <p>
          <Input
            placeholder="name"
            value={params.name ?? ""}
            onChange={(name) =>
              setParams({ ...params, name: name || undefined })
            }
          />
        </p>
        <p>
          <Input
            placeholder="country code"
            value={params.country?.code ?? ""}
            onChange={(code) =>
              setParams({
                ...params,
                country: { ...params.country, code: code || undefined },
              })
            }
          />
        </p>
      </>
    );
  });
