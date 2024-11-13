import{o}from"./stackblitz.Cf9Oavkp.js";import"./hoisted.BlAAbcCc.js";const r=`import { $route } from "dreamkit";

export const homeRoute = $route.path("/").create(() => {
  return <>hello world</>;
});
`,t=document.querySelector('a[href="#playground"]');t.addEventListener("click",e=>{e.preventDefault(),o({appCode:r})});
