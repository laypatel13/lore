import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as NavBar, t as Link$1 } from "./NavBar-BBkF6m3E.mjs";
import { t as SpecBox } from "./SpecBox-BDDSgnYt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C8eFXsXM.js
var import_jsx_runtime = require_jsx_runtime();
var LandingPage_module_default = {
	accentWord: "_3xdRia_accentWord",
	answerText: "_3xdRia_answerText",
	blink: "_3xdRia_blink",
	caseFile: "_3xdRia_caseFile",
	caseFileBody: "_3xdRia_caseFileBody",
	caseFileHeader: "_3xdRia_caseFileHeader",
	caseFileMeta: "_3xdRia_caseFileMeta",
	caseFileStatus: "_3xdRia_caseFileStatus",
	ctaEyebrow: "_3xdRia_ctaEyebrow",
	ctaSection: "_3xdRia_ctaSection",
	ctaTitle: "_3xdRia_ctaTitle",
	cursor: "_3xdRia_cursor",
	evidenceDivider: "_3xdRia_evidenceDivider",
	evidenceRow: "_3xdRia_evidenceRow",
	eyebrow: "_3xdRia_eyebrow",
	footer: "_3xdRia_footer",
	footerLogo: "_3xdRia_footerLogo",
	footerLogoText: "_3xdRia_footerLogoText",
	headline: "_3xdRia_headline",
	hero: "_3xdRia_hero",
	heroActions: "_3xdRia_heroActions",
	heroInner: "_3xdRia_heroInner",
	logoMark: "_3xdRia_logoMark",
	opFn: "_3xdRia_opFn",
	opsGrid: "_3xdRia_opsGrid",
	page: "_3xdRia_page",
	queryBlock: "_3xdRia_queryBlock",
	queryText: "_3xdRia_queryText",
	repoLine: "_3xdRia_repoLine",
	section: "_3xdRia_section",
	sectionEyebrow: "_3xdRia_sectionEyebrow",
	sectionRule: "_3xdRia_sectionRule",
	sectionTitle: "_3xdRia_sectionTitle",
	statCell: "_3xdRia_statCell",
	statsStrip: "_3xdRia_statsStrip",
	statVal: "_3xdRia_statVal",
	step: "_3xdRia_step",
	stepBody: "_3xdRia_stepBody",
	stepCode: "_3xdRia_stepCode",
	stepNum: "_3xdRia_stepNum",
	stepsGrid: "_3xdRia_stepsGrid",
	stepTitle: "_3xdRia_stepTitle",
	subline: "_3xdRia_subline"
};
var OPS = [
	{
		fn: "remember()",
		color: "#4ADE80",
		desc: "Ingest commits, PRs, and issues into the knowledge graph. Every decision, permanently mapped."
	},
	{
		fn: "recall()",
		color: "#7FDBFF",
		desc: "Ask anything. Cognee routes between semantic search and graph traversal to surface the right answer."
	},
	{
		fn: "improve()",
		color: "#FBBF24",
		desc: "Enrich memory after new commits. Prune stale nodes. The graph sharpens as your codebase grows."
	},
	{
		fn: "forget()",
		color: "#F87171",
		desc: "Surgically remove deprecated branches or outdated context from persistent memory."
	}
];
var STEPS = [
	{
		n: "01",
		title: "Point Lore at your repo",
		body: "Paste any public GitHub URL. Lore ingests every commit, PR, issue, and comment — the full institutional history of your codebase.",
		code: "await cognee.remember(repo_url)"
	},
	{
		n: "02",
		title: "Cognee builds the graph",
		body: "History is structured into a hybrid graph-vector knowledge graph. Relationships between decisions, contributors, and code are permanently mapped.",
		code: "graph + vector → knowledge"
	},
	{
		n: "03",
		title: "Query forever",
		body: "Ask anything about your codebase's past. Memory persists across infinite sessions — context never dies, every answer cites its sources.",
		code: "await cognee.recall(question)"
	}
];
function LandingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: LandingPage_module_default.page,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavBar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: LandingPage_module_default.hero,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `container ${LandingPage_module_default.heroInner}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: LandingPage_module_default.heroLeft,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: LandingPage_module_default.eyebrow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "status-dot active" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									children: "MEMORY ACTIVE · COGNEE GRAPH ONLINE"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: `t-display-xl ${LandingPage_module_default.headline}`,
								children: [
									"Your codebase",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: LandingPage_module_default.accentWord,
										children: "remembers."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"Finally."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `t-body-lg ${LandingPage_module_default.subline}`,
								children: "Every commit hides a decision. Every PR buries a reason. Lore gives your codebase a persistent memory — so you can interrogate the past, any time, forever."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: LandingPage_module_default.heroActions,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
									to: "/analyze",
									className: "btn-primary",
									children: "Open a Case →"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "#process",
									className: "btn-secondary",
									children: "How it works"
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: LandingPage_module_default.caseFile,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: LandingPage_module_default.caseFileHeader,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: LandingPage_module_default.caseFileMeta,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--ink-ghost)" },
									children: "CASE FILE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-sm",
									style: { color: "var(--ink-dim)" },
									children: "#0042"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: LandingPage_module_default.caseFileStatus,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "status-dot active" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--success)" },
									children: "MEMORY ACTIVE"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: LandingPage_module_default.caseFileBody,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: LandingPage_module_default.repoLine,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "t-label",
										children: "Repository"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "t-mono-sm",
										style: { color: "var(--ink)" },
										children: "vercel/next.js"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: LandingPage_module_default.queryBlock,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "t-label",
										style: { marginBottom: 8 },
										children: "Query"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: LandingPage_module_default.queryText,
										children: "\"Why did we switch from Webpack to Turbopack in 2023?\""
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: LandingPage_module_default.answerText,
									children: [
										"The migration was triggered by ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "build time complaints" }),
										" across 47 open issues. Benchmarks in ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "PR #51203" }),
										" confirmed",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "10x faster cold starts" }),
										". Decision authored by",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "@timneutkens" }),
										" in RFC Sept 14, 2023.",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: LandingPage_module_default.cursor })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: LandingPage_module_default.evidenceDivider }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-label",
									style: { marginBottom: 8 },
									children: "Evidence"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: LandingPage_module_default.evidenceRow,
									children: [
										"issue #42847",
										"PR #51203",
										"commit a3f9b2c",
										"RFC Sept 2023"
									].map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bp-tag",
										children: e
									}, e))
								})
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: LandingPage_module_default.statsStrip,
				children: [
					{
						val: "∞",
						label: "Sessions remembered"
					},
					{
						val: "4",
						label: "Memory operations"
					},
					{
						val: "Any",
						label: "Public GitHub repo"
					},
					{
						val: "0",
						label: "Context lost"
					}
				].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: LandingPage_module_default.statCell,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: LandingPage_module_default.statVal,
						children: s.val
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "t-label",
						children: s.label
					})]
				}, s.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: LandingPage_module_default.section,
				id: "process",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: LandingPage_module_default.sectionEyebrow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "t-label",
								children: "// The Process"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: LandingPage_module_default.sectionRule })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: `t-display-md ${LandingPage_module_default.sectionTitle}`,
							children: "Three steps. Total recall."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: LandingPage_module_default.stepsGrid,
							children: STEPS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `bp-card ${LandingPage_module_default.step}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: LandingPage_module_default.stepNum,
										children: s.n
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `t-heading ${LandingPage_module_default.stepTitle}`,
										children: s.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `t-body-sm ${LandingPage_module_default.stepBody}`,
										children: s.body
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: LandingPage_module_default.stepCode,
										children: s.code
									})
								]
							}, s.n))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: LandingPage_module_default.section,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: LandingPage_module_default.sectionEyebrow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "t-label",
								children: "// Memory Lifecycle"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: LandingPage_module_default.sectionRule })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: `t-display-md ${LandingPage_module_default.sectionTitle}`,
							children: [
								"Four operations.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Nothing forgotten."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: LandingPage_module_default.opsGrid,
							children: OPS.map((op) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpecBox, {
								label: op.fn,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: LandingPage_module_default.opFn,
									style: { color: op.color },
									children: op.fn
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "t-body-sm",
									style: {
										color: "var(--ink-dim)",
										lineHeight: 1.65
									},
									children: op.desc
								})]
							}, op.fn))
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: LandingPage_module_default.ctaSection,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "container",
					style: { textAlign: "center" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: LandingPage_module_default.ctaEyebrow,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "t-label",
								children: "// Open a Case · Free · No Setup"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: `t-display-lg ${LandingPage_module_default.ctaTitle}`,
							children: [
								"What does your",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: LandingPage_module_default.accentWord,
									children: "codebase know?"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "t-body",
							style: {
								color: "var(--ink-dim)",
								marginBottom: 40
							},
							children: "Paste a GitHub URL. Lore handles the rest."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
							to: "/analyze",
							className: "btn-primary",
							style: {
								fontSize: "13px",
								padding: "13px 36px"
							},
							children: "Open a Case →"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: LandingPage_module_default.footer,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: LandingPage_module_default.footerLogo,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: LandingPage_module_default.logoMark,
						children: "L"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: LandingPage_module_default.footerLogoText,
						children: "LORE"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "t-mono-xs",
					style: { color: "var(--ink-ghost)" },
					children: "// memory powered by cognee · wemakedevs hackathon 2026"
				})]
			})
		]
	});
}
var SplitComponent = LandingPage;
//#endregion
export { SplitComponent as component };
