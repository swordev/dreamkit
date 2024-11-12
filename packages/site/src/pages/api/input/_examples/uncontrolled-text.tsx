// title: Uncontrolled text
import { $route, Input } from "dreamkit";

export default $route.path("/").create(() => {
  return (
    <Input
      defaultValue="example"
      onChange={(value) => console.log("value", value)}
    />
  );
});
