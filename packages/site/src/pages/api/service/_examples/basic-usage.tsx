// title: Basic usage
import { $route, ServiceClass } from "dreamkit";

export class AppService extends ServiceClass({}) {
  onStart() {
    console.log("started"); // edit this line and save
    return () => console.log("stopped");
  }
}

export const homeRoute = $route.path("/").create(() => {
  return <>hello world</>;
});
