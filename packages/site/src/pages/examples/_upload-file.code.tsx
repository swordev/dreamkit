// @ts-expect-error
import { $route, Input, $api, s, createAction, StorageClass } from "dreamkit";
import { createSignal } from "solid-js";

export class ImageStorage extends StorageClass({
  name: "image",
  public: true,
}) {}

const upload = $api
  .title("Upload")
  .self({ ImageStorage })
  .params({
    file: s.file().max("20mb").ext(["png"]),
  })
  .create(async function ({ file }) {
    return {
      // @ts-expect-error
      url: await this.imageStorage.add(file),
    };
  });

export const uploadRoute = $route
  .api({ upload })
  .path("/")
  .create(({ api }) => {
    const [file, setFile] = createSignal<File | null>(null);
    const upload = createAction(api.upload).with({
      get file() {
        return file()!;
      },
    });
    return (
      <>
        <Input
          type="file"
          value={file}
          onChange={setFile}
          disabled={upload.running}
        />
        {/* @ts-expect-error */}
        {upload.running && <>{upload.progress}%</>}
        <button
          onClick={upload}
          disabled={!file() || upload.running}
          children={upload.title}
        />
      </>
    );
  });
