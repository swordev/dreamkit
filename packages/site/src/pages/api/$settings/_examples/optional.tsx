// title: Optional
import {
  $api,
  $route,
  $settings,
  createAction,
  iocParam,
  s,
  SettingsHandler,
} from "dreamkit";

export const MailSettings = $settings
  .name("mail")
  .params({ hostname: s.string(), username: s.string(), password: s.string() })
  // With optional, MailSettings is not required for startup the application
  .optional()
  .create();

const sendMail = $api
  .title("Send mail")
  // MailSettings is required, so it will throw an error if it is not defined before of calling this action
  .self({ MailSettings })
  .create(function () {
    console.log("Sending mail with settings:", this.mailSettings.params);
  });

const trySendMail = $api
  .title("Try send mail")
  .self({ mailSettings: iocParam(MailSettings).optional() })
  .create(function () {
    if (!this.mailSettings) throw new Error("Mail settings is not defined");
    console.log("Sending mail with settings:", this.mailSettings.params);
  });

const initMailSettings = $api
  .title("Init mail settings")
  .self({ SettingsHandler })
  .create(async function () {
    await this.settingsHandler.set(MailSettings, {
      hostname: "smtp.localhost",
      username: "admin",
      password: "admin",
    });
  });

export default $route
  .path("/")
  .api({ sendMail, trySendMail, initMailSettings })
  .create(({ api }) => {
    const sendMail = createAction(api.sendMail);
    const trySendMail = createAction(api.trySendMail);
    const initMailSettings = createAction(api.initMailSettings);
    return (
      <>
        <p>
          <button
            onClick={sendMail}
            children={
              <>
                {sendMail.title} ({sendMail.state})
              </>
            }
          />
        </p>
        <p>
          <button
            onClick={trySendMail}
            children={
              <>
                {trySendMail.title} ({trySendMail.state})
              </>
            }
          />
        </p>
        <p>
          {initMailSettings.state === "success" && <p>MailSettings ready</p>}
          <button
            onClick={initMailSettings}
            children={initMailSettings.title}
          />
        </p>
      </>
    );
  });
