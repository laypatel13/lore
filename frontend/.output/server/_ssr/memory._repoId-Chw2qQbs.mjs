import { o as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { i as useParams$1, n as NavBar } from "./NavBar-BBkF6m3E.mjs";
import { t as api } from "./client-CKq_itpl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/memory._repoId-Chw2qQbs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MemoryPage_module_default = {
	canvasLabel: "AvyL0W_canvasLabel",
	connItem: "AvyL0W_connItem",
	detailFooter: "AvyL0W_detailFooter",
	detailHeader: "AvyL0W_detailHeader",
	detailPanel: "AvyL0W_detailPanel",
	detailSection: "AvyL0W_detailSection",
	filterDot: "AvyL0W_filterDot",
	filterLeft: "AvyL0W_filterLeft",
	filterRow: "AvyL0W_filterRow",
	forget: "AvyL0W_forget",
	graphArea: "AvyL0W_graphArea",
	graphCanvas: "AvyL0W_graphCanvas",
	improve: "AvyL0W_improve",
	layout: "AvyL0W_layout",
	node: "AvyL0W_node",
	nodeActive: "AvyL0W_nodeActive",
	nodeDot: "AvyL0W_nodeDot",
	nodeId: "AvyL0W_nodeId",
	nodeName: "AvyL0W_nodeName",
	nodeType: "AvyL0W_nodeType",
	opBtn: "AvyL0W_opBtn",
	opFill: "AvyL0W_opFill",
	opTrack: "AvyL0W_opTrack",
	page: "AvyL0W_page",
	sidebar: "AvyL0W_sidebar",
	sideSection: "AvyL0W_sideSection",
	thoughtLine: "AvyL0W_thoughtLine",
	thoughtStream: "AvyL0W_thoughtStream"
};
var NODES = [
	{
		id: "core",
		label: "App Router",
		type: "Decision",
		x: "50%",
		y: "47%"
	},
	{
		id: "contrib",
		label: "@timneutkens",
		type: "Contributor",
		x: "28%",
		y: "24%"
	},
	{
		id: "issue",
		label: "Hydration Bug",
		type: "Issue",
		x: "72%",
		y: "28%"
	},
	{
		id: "commit",
		label: "Turbopack Init",
		type: "Commit",
		x: "68%",
		y: "68%"
	},
	{
		id: "doc",
		label: "Build RFC",
		type: "Document",
		x: "83%",
		y: "55%"
	},
	{
		id: "sokra",
		label: "@sokra",
		type: "Contributor",
		x: "16%",
		y: "40%"
	},
	{
		id: "perf",
		label: "Perf Report",
		type: "Issue",
		x: "30%",
		y: "70%"
	}
];
var NODE_COLORS = {
	Decision: "var(--accent)",
	Contributor: "var(--success)",
	Issue: "var(--warn)",
	Commit: "var(--line)",
	Document: "var(--ink-dim)"
};
function MemoryPage() {
	const { repoId } = useParams$1();
	const [stats, setStats] = (0, import_react.useState)(null);
	const [selectedId, setSelected] = (0, import_react.useState)("core");
	const [op, setOp] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!repoId) return;
		api.chat.stats(repoId).then(setStats).catch(() => {});
	}, [repoId]);
	const runOp = async (type) => {
		if (!repoId) return;
		const { label, msgs } = {
			improve: {
				label: "Running improve()",
				msgs: [
					"Enriching graph nodes...",
					"Pruning stale edges...",
					"Adapting weights...",
					"✓ Graph enriched"
				]
			},
			forget: {
				label: "Running forget()",
				msgs: [
					"Identifying deprecated nodes...",
					"Pruning dataset...",
					"Removing nodes...",
					"✓ Memory pruned"
				]
			}
		}[type];
		for (let i = 0; i < msgs.length; i++) {
			setOp({
				label,
				pct: (i + 1) / msgs.length * 100,
				msg: msgs[i]
			});
			await new Promise((r) => setTimeout(r, 700));
		}
		try {
			type === "improve" ? await api.chat.improve(repoId) : await api.chat.forget(repoId);
		} catch {}
		setTimeout(() => setOp(null), 1200);
	};
	const sel = NODES.find((n) => n.id === selectedId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: MemoryPage_module_default.page,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavBar, {
			repoId,
			repoName: `Case #${repoId?.slice(0, 8)}`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: MemoryPage_module_default.layout,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: MemoryPage_module_default.sidebar,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.sideSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 12 },
								children: "Node Filters"
							}), Object.entries(NODE_COLORS).map(([type, color]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: MemoryPage_module_default.filterRow,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: MemoryPage_module_default.filterLeft,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											defaultChecked: true,
											style: { accentColor: "var(--accent)" }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: MemoryPage_module_default.filterDot,
											style: { background: color }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "t-body-sm",
											style: { color: "var(--ink-dim)" },
											children: type
										})
									]
								})
							}, type))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.sideSection,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-label",
									style: { marginBottom: 12 },
									children: "Memory Operations"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: `${MemoryPage_module_default.opBtn} ${MemoryPage_module_default.improve}`,
									onClick: () => runOp("improve"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "improve()" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: `${MemoryPage_module_default.opBtn} ${MemoryPage_module_default.forget}`,
									onClick: () => runOp("forget"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "forget(dataset)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "→" })]
								})
							]
						}),
						stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.sideSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 12 },
								children: "Graph Stats"
							}), [
								["Total Nodes", stats.total_nodes],
								["Total Edges", stats.total_edges],
								["Last Updated", new Date(stats.last_updated).toLocaleDateString()]
							].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: MemoryPage_module_default.filterRow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--ink-ghost)" },
									children: k
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--accent)" },
									children: v
								})]
							}, k))]
						}),
						op && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.sideSection,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-label",
									style: { marginBottom: 8 },
									children: op.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: MemoryPage_module_default.opTrack,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: MemoryPage_module_default.opFill,
										style: { width: `${op.pct}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-mono-xs",
									style: {
										color: "var(--ink-ghost)",
										marginTop: 6
									},
									children: op.msg
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: MemoryPage_module_default.graphArea,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: MemoryPage_module_default.graphCanvas,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								style: {
									position: "absolute",
									inset: 0,
									width: "100%",
									height: "100%",
									pointerEvents: "none"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("marker", {
										id: "arr",
										markerWidth: "6",
										markerHeight: "6",
										refX: "3",
										refY: "3",
										orient: "auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: "M0,0 L0,6 L6,3 z",
											fill: "rgba(127,219,255,0.4)"
										})
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "50%",
										y1: "47%",
										x2: "28%",
										y2: "24%",
										stroke: "rgba(127,219,255,0.35)",
										strokeWidth: "1.5",
										markerEnd: "url(#arr)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "50%",
										y1: "47%",
										x2: "72%",
										y2: "28%",
										stroke: "rgba(127,219,255,0.2)",
										strokeWidth: "1",
										strokeDasharray: "4 4"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "50%",
										y1: "47%",
										x2: "68%",
										y2: "68%",
										stroke: "rgba(127,219,255,0.4)",
										strokeWidth: "2",
										markerEnd: "url(#arr)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "68%",
										y1: "68%",
										x2: "83%",
										y2: "55%",
										stroke: "rgba(127,219,255,0.2)",
										strokeWidth: "1",
										strokeDasharray: "3 5"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "28%",
										y1: "24%",
										x2: "16%",
										y2: "40%",
										stroke: "rgba(127,219,255,0.2)",
										strokeWidth: "1"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "50%",
										y1: "47%",
										x2: "30%",
										y2: "70%",
										stroke: "rgba(127,219,255,0.2)",
										strokeWidth: "1",
										strokeDasharray: "4 4"
									})
								]
							}),
							NODES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `${MemoryPage_module_default.node} ${selectedId === n.id ? MemoryPage_module_default.nodeActive : ""}`,
								style: {
									left: n.x,
									top: n.y
								},
								onClick: () => setSelected(n.id),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: MemoryPage_module_default.nodeId,
										children: ["#", n.id.toUpperCase()]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: MemoryPage_module_default.nodeDot,
										style: { background: NODE_COLORS[n.type] }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: MemoryPage_module_default.nodeName,
										children: n.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: MemoryPage_module_default.nodeType,
										style: { color: NODE_COLORS[n.type] },
										children: n.type
									})
								]
							}, n.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: MemoryPage_module_default.canvasLabel,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "t-mono-xs",
									style: { color: "var(--ink-ghost)" },
									children: [
										"Showing ",
										NODES.length,
										" of ",
										stats?.total_nodes ?? "…",
										" nodes"
									]
								})
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: MemoryPage_module_default.detailPanel,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.detailHeader,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 6 },
								children: "Node Details"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-heading",
								style: { color: NODE_COLORS[sel.type] },
								children: sel.label
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.detailSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 6 },
								children: "Identifier"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "bp-tag",
								children: [
									"#",
									sel.id.toUpperCase(),
									"-001"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.detailSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 8 },
								children: "Type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: MemoryPage_module_default.filterDot,
									style: { background: NODE_COLORS[sel.type] }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "t-body-sm",
									children: [sel.type, " Node"]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.detailSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 8 },
								children: "Connections"
							}), [
								"→ PR #51203 (Strong)",
								"→ Issue #42847 (Medium)",
								"→ commit a3f9b2c (Weak)"
							].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: MemoryPage_module_default.connItem,
								children: c
							}, c))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: MemoryPage_module_default.detailSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 8 },
								children: "Thought Stream"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: MemoryPage_module_default.thoughtStream,
								children: [
									"> Memory node initialized",
									"> Linked to 3 edges",
									"> High recall frequency",
									"> Last queried: recently"
								].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: MemoryPage_module_default.thoughtLine,
									children: t
								}, t))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: MemoryPage_module_default.detailFooter,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn-ghost",
								style: {
									width: "100%",
									justifyContent: "center"
								},
								onClick: () => window.location.href = `/chat/${repoId}`,
								children: "Ask about this node →"
							})
						})
					]
				})
			]
		})]
	});
}
var SplitComponent = MemoryPage;
//#endregion
export { SplitComponent as component };
