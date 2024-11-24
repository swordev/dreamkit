import { ResponseHeaders } from "../ResponseHeaders.js";
import type {
  InferSessionParams,
  SessionConstructor,
} from "../builders/SessionBuilder.js";
import { InferSettingsParams } from "../builders/SettingsBuilder.js";
import { SessionHandlerClass } from "../handlers/SessionHandler.js";
import { SettingsHandler } from "../handlers/SettingsHandler.js";
import { decodeCookies, encodeCookie } from "../utils/cookies.js";
import { decrypt, encrypt } from "../utils/crypto.js";
import { ClientSessionSettings, generate } from "./ClientSessionSettings.js";

export class ClientSessionHandler extends SessionHandlerClass({
  Headers,
  ResponseHeaders,
  SettingsHandler,
}) {
  protected cookies: Map<string, string> | undefined;
  protected decryptedCookies = new Map<string, any>();
  protected nextCookies = new Map<string, any>();
  async settings(): Promise<InferSettingsParams<typeof ClientSessionSettings>> {
    const settings = this.settingsHandler.get(ClientSessionSettings);
    if (settings) return settings;
    const params = generate();
    await this.settingsHandler.set(ClientSessionSettings, params);
    return params;
  }
  protected async onGet<T extends SessionConstructor>(
    input: SessionConstructor,
  ): Promise<InferSessionParams<T> | undefined> {
    const name = input.options.name!;
    if (this.nextCookies.has(name)) return this.nextCookies.get(name);
    if (this.decryptedCookies.has(name)) return this.decryptedCookies.get(name);
    if (!this.cookies) {
      const cookie = this.headers.get("cookie");
      this.cookies = decodeCookies(cookie ?? "");
    }
    const value = this.cookies.get(name);
    if (!value) return;
    try {
      const settings = await this.settings();
      const { iv, key } = settings;
      const decryptedJson = await decrypt(value, iv, key);
      const decryptedValue = JSON.parse(decryptedJson);
      this.decryptedCookies.set(name, decryptedValue);
      return decryptedValue;
    } catch (error) {
      console.warn(error);
      return;
    }
  }
  protected async onSet(input: SessionConstructor, value: any) {
    const name = input.options.name!;
    if (value === undefined || value === null) {
      const cookie = encodeCookie({
        name,
        value: "",
        path: "/",
        expires: new Date("Thu Jan 01 1970 00:00:00 UTC"),
      });
      this.nextCookies.set(name, undefined);
      this.responseHeaders.set("Set-Cookie", cookie);
    } else {
      const settings = await this.settings();
      const { iv, key } = settings;
      const jsonValue = JSON.stringify(value);
      const cookie = encodeCookie({
        name,
        path: "/",
        ...(input.options.timelife && {
          maxAge:
            (input.options.timelife.days || 0 * 24 * 60 * 60) +
            (input.options.timelife.hours || 0 * 60 * 60) +
            (input.options.timelife.minutes || 0 * 60) +
            (input.options.timelife.seconds || 0),
        }),
        value: await encrypt(jsonValue, iv, key),
      });
      this.nextCookies.set(name, value);
      this.responseHeaders.set("Set-Cookie", cookie);
    }
  }
}
