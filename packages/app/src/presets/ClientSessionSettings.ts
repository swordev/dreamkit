import { $settings } from "../objects/$settings.js";
import { generateIv, generateKey } from "../utils/crypto.js";
import { InferObjectProps, s } from "@dreamkit/schema";

const params = {
  key: s.string(),
  iv: s.string(),
};

export class ClientSessionSettings extends $settings
  .name("clientSession")
  .params(params)
  .optional()
  // generated on demand in ClientSessionHandler
  //.generate(generate)
  .create() {}

export function generate(): InferObjectProps<typeof params> {
  return {
    iv: generateIv(),
    key: generateKey(),
  };
}
