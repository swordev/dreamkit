import{o}from"./stackblitz.sVuNfO5z.js";import"./hoisted.bnIRwXly.js";const r=`import { $route } from "dreamkit";

export const homeRoute = $route.path("/").create(() => {
  return <>hello world</>;
});
`,t=document.querySelector('a[href="#playground"]');t.addEventListener("click",e=>{e.preventDefault(),o({appCode:r})});