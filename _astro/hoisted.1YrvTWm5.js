import{o as n}from"./stackblitz.BcXDBGHS.js";import"./hoisted.bnIRwXly.js";document.addEventListener("click",t=>{const e=t.target instanceof HTMLElement?t.target.matches("[data-project-code]")?t.target:void 0:t.target instanceof Element?t.target.closest("[data-project-code]"):void 0;if(e){t.preventDefault();const a=e.dataset.projectPkgDependencies?JSON.parse(e.dataset.projectPkgDependencies):{},c=e.dataset.projectPkgDevDependencies?JSON.parse(e.dataset.projectPkgDevDependencies):{};n({pkgDependencies:a,pkgDevDependencies:c,appFile:e.dataset.projectFileName,appCode:e.dataset.projectCode??""})}});
