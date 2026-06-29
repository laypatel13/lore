import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { _ as useNavigate, g as Link, l as useLocation, v as useParams } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/NavBar-BBkF6m3E.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Compatibility shim: maps the react-router-dom API used by the LORE pages
* onto TanStack Router. Behavior is identical from the page's perspective —
* no business logic changed.
*/
function Link$1({ to, children, ...rest }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		...rest,
		children
	});
}
function useNavigate$1() {
	const navigate = useNavigate();
	return (to) => navigate({ to });
}
function useParams$1() {
	return useParams({ strict: false });
}
function useLocation$1() {
	return useLocation();
}
var NavBar_module_default = {
	logo: "k6Tk2W_logo",
	logoMark: "k6Tk2W_logoMark",
	logoText: "k6Tk2W_logoText",
	logoVersion: "k6Tk2W_logoVersion",
	nav: "k6Tk2W_nav",
	navCenter: "k6Tk2W_navCenter",
	navLeft: "k6Tk2W_navLeft",
	navRight: "k6Tk2W_navRight",
	repoChip: "k6Tk2W_repoChip",
	separator: "k6Tk2W_separator"
};
function NavBar({ repoId, repoName }) {
	const { pathname } = useLocation$1();
	const isHome = pathname === "/";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: NavBar_module_default.nav,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: NavBar_module_default.navLeft,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link$1, {
					to: "/",
					className: NavBar_module_default.logo,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: NavBar_module_default.logoMark,
							children: "L"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: NavBar_module_default.logoText,
							children: "LORE"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: NavBar_module_default.logoVersion,
							children: "v0.1"
						})
					]
				}), repoName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: NavBar_module_default.separator }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: NavBar_module_default.repoChip,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "status-dot active" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "t-mono-sm",
						style: { color: "var(--ink-dim)" },
						children: repoName
					})]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: NavBar_module_default.navCenter,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "t-mono-xs",
					style: { color: "var(--ink-ghost)" },
					children: "// CODEBASE MEMORY · COGNEE GRAPH ONLINE"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: NavBar_module_default.navRight,
				children: [repoId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: `/chat/${repoId}`,
					className: "btn-ghost",
					children: "Chat"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: `/memory/${repoId}`,
					className: "btn-ghost",
					children: "Graph"
				})] }), isHome && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
					to: "/analyze",
					className: "btn-primary",
					style: {
						padding: "8px 20px",
						fontSize: "11px"
					},
					children: "Open Case →"
				})]
			})
		]
	});
}
//#endregion
export { useParams$1 as i, NavBar as n, useNavigate$1 as r, Link$1 as t };
