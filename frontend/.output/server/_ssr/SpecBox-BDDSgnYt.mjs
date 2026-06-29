import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SpecBox-BDDSgnYt.js
var import_jsx_runtime = require_jsx_runtime();
var SpecBox_module_default = {
	accent: "fmtnNa_accent",
	body: "fmtnNa_body",
	box: "fmtnNa_box"
};
function SpecBox({ label, meta, children, className = "", accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `bp-card ${SpecBox_module_default.box} ${accent ? SpecBox_module_default.accent : ""} ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "spec-header",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "t-label",
				children: label
			}), meta && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "t-mono-xs",
				style: { color: "var(--ink-ghost)" },
				children: meta
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: SpecBox_module_default.body,
			children
		})]
	});
}
//#endregion
export { SpecBox as t };
