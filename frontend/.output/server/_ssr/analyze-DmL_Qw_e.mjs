import { o as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { n as NavBar, r as useNavigate$1 } from "./NavBar-BBkF6m3E.mjs";
import { t as SpecBox } from "./SpecBox-BDDSgnYt.mjs";
import { t as api } from "./client-CKq_itpl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analyze-DmL_Qw_e.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AnalyzePage_module_default = {
	active: "uXGF8q_active",
	badge: "uXGF8q_badge",
	checkboxRow: "uXGF8q_checkboxRow",
	checkChip: "uXGF8q_checkChip",
	content: "uXGF8q_content",
	done: "uXGF8q_done",
	header: "uXGF8q_header",
	idle: "uXGF8q_idle",
	infoGrid: "uXGF8q_infoGrid",
	inputRow: "uXGF8q_inputRow",
	logLine: "uXGF8q_logLine",
	logStream: "uXGF8q_logStream",
	logSuccess: "uXGF8q_logSuccess",
	mutedLabel: "uXGF8q_mutedLabel",
	page: "uXGF8q_page",
	progressFill: "uXGF8q_progressFill",
	progressTrack: "uXGF8q_progressTrack",
	spin: "uXGF8q_spin",
	statCell: "uXGF8q_statCell",
	statsGrid: "uXGF8q_statsGrid",
	statVal: "uXGF8q_statVal",
	stepIcon: "uXGF8q_stepIcon",
	stepRow: "uXGF8q_stepRow",
	stepsList: "uXGF8q_stepsList",
	successCard: "uXGF8q_successCard",
	successHeader: "uXGF8q_successHeader",
	title: "uXGF8q_title",
	urlInput: "uXGF8q_urlInput"
};
var STEPS = [
	{
		label: "Fetching repository metadata",
		code: "github.fetch_meta()"
	},
	{
		label: "Pulling commit history",
		code: "github.fetch_commits()"
	},
	{
		label: "Ingesting pull requests & issues",
		code: "github.fetch_prs() + issues()"
	},
	{
		label: "Building Cognee knowledge graph",
		code: "cognee.remember(data)"
	},
	{
		label: "Running improve() enrichment",
		code: "cognee.improve()"
	}
];
function AnalyzePage() {
	const navigate = useNavigate$1();
	const [url, setUrl] = (0, import_react.useState)("");
	const [includeCommits, setCommits] = (0, import_react.useState)(true);
	const [includePrs, setPrs] = (0, import_react.useState)(true);
	const [includeIssues, setIssues] = (0, import_react.useState)(true);
	const [phase, setPhase] = (0, import_react.useState)("input");
	const [status, setStatus] = (0, import_react.useState)(null);
	const [stepStates, setStepStates] = (0, import_react.useState)(Array(5).fill("idle"));
	const [logs, setLogs] = (0, import_react.useState)([]);
	const [errorMsg, setErrorMsg] = (0, import_react.useState)("");
	const logRef = (0, import_react.useRef)(null);
	const pollRef = (0, import_react.useRef)(null);
	const addLog = (msg) => setLogs((p) => [...p, msg]);
	const setStep = (i, s) => setStepStates((p) => {
		const n = [...p];
		n[i] = s;
		return n;
	});
	(0, import_react.useEffect)(() => {
		logRef.current?.scrollTo(0, logRef.current.scrollHeight);
	}, [logs]);
	(0, import_react.useEffect)(() => () => {
		if (pollRef.current) clearInterval(pollRef.current);
	}, []);
	const simulateProgress = () => {
		let step = 0;
		addLog("> Initializing Cognee memory layer...");
		addLog("> Connecting to GitHub API...");
		const advance = () => {
			if (step >= STEPS.length) return;
			setStep(step, "active");
			addLog(`> ${STEPS[step].label}...`);
			setTimeout(() => {
				setStep(step, "done");
				addLog(`> ✓ ${STEPS[step].code}`);
				step++;
				if (step < STEPS.length) setTimeout(advance, 1400);
			}, 1600);
		};
		advance();
	};
	const handleSubmit = async () => {
		if (!url.trim()) return;
		setErrorMsg("");
		setPhase("ingesting");
		setStepStates(Array(5).fill("idle"));
		setLogs([]);
		try {
			const res = await api.ingest.start({
				repo_url: url.trim(),
				include_commits: includeCommits,
				include_prs: includePrs,
				include_issues: includeIssues
			});
			setStatus(res);
			simulateProgress();
			pollRef.current = setInterval(async () => {
				try {
					const s = await api.ingest.getStatus(res.repo_id);
					setStatus(s);
					if (s.status === "complete") {
						clearInterval(pollRef.current);
						setTimeout(() => setPhase("done"), 800);
					} else if (s.status === "error") {
						clearInterval(pollRef.current);
						setErrorMsg(s.message);
						setPhase("error");
					}
				} catch {}
			}, 2e3);
		} catch (e) {
			setErrorMsg(e?.response?.data?.detail || "Failed to connect to backend.");
			setPhase("error");
		}
	};
	const pct = stepStates.filter((s) => s === "done").length / STEPS.length * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: AnalyzePage_module_default.page,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavBar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: AnalyzePage_module_default.content,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: AnalyzePage_module_default.header,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: AnalyzePage_module_default.badge,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "status-dot active" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "t-mono-xs",
								children: "CASE INTAKE · STEP 1 OF 3"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: `t-display-lg ${AnalyzePage_module_default.title}`,
							children: "Open a Case"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "t-body",
							style: {
								color: "var(--ink-dim)",
								maxWidth: 520
							},
							children: "Point Lore at any public GitHub repository. It will ingest your full commit history, pull requests, and issues into a persistent Cognee knowledge graph."
						})
					]
				}),
				phase === "input" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpecBox, {
					label: "Repository URL",
					meta: "Public repos only",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: AnalyzePage_module_default.inputRow,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: AnalyzePage_module_default.urlInput,
							type: "text",
							value: url,
							onChange: (e) => setUrl(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && handleSubmit(),
							placeholder: "https://github.com/owner/repository"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn-primary",
							onClick: handleSubmit,
							children: "Ingest →"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: AnalyzePage_module_default.checkboxRow,
						children: [
							{
								label: "Commits",
								val: includeCommits,
								set: setCommits
							},
							{
								label: "Pull Requests",
								val: includePrs,
								set: setPrs
							},
							{
								label: "Issues",
								val: includeIssues,
								set: setIssues
							}
						].map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: AnalyzePage_module_default.checkChip,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: o.val,
								onChange: (e) => o.set(e.target.checked)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "t-mono-xs",
								children: o.label
							})]
						}, o.label))
					})]
				}),
				(phase === "ingesting" || phase === "done") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpecBox, {
					label: "Ingestion Progress",
					meta: phase === "done" ? "✓ COMPLETE" : "RUNNING...",
					accent: phase === "done",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: AnalyzePage_module_default.progressTrack,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: AnalyzePage_module_default.progressFill,
								style: { width: phase === "done" ? "100%" : `${pct}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: AnalyzePage_module_default.stepsList,
							children: STEPS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: AnalyzePage_module_default.stepRow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `${AnalyzePage_module_default.stepIcon} ${AnalyzePage_module_default[stepStates[i]]}`,
									children: stepStates[i] === "done" ? "✓" : String(i + 1).padStart(2, "0")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `t-body-sm ${stepStates[i] === "idle" ? AnalyzePage_module_default.mutedLabel : ""}`,
									children: s.label
								}), stepStates[i] !== "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--ink-ghost)" },
									children: s.code
								})] })]
							}, i))
						}),
						status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: AnalyzePage_module_default.statsGrid,
							children: [
								["Commits", status.commits],
								["Pull Requests", status.prs],
								["Issues", status.issues],
								["Nodes", status.nodes || status.commits + status.prs + status.issues]
							].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: AnalyzePage_module_default.statCell,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: AnalyzePage_module_default.statVal,
									children: v.toLocaleString()
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-label",
									children: k
								})]
							}, k))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: AnalyzePage_module_default.logStream,
							ref: logRef,
							children: logs.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${AnalyzePage_module_default.logLine} ${l.startsWith("> ✓") ? AnalyzePage_module_default.logSuccess : ""}`,
								children: l
							}, i))
						})
					]
				}),
				phase === "done" && status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `bp-card ${AnalyzePage_module_default.successCard}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: AnalyzePage_module_default.successHeader,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "status-dot active" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "t-mono-xs",
							style: { color: "var(--success)" },
							children: "CASE OPENED · MEMORY ACTIVE"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: { padding: 24 },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "t-heading",
								style: {
									color: "var(--ink)",
									marginBottom: 8
								},
								children: "Codebase ingested."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "t-body-sm",
								style: {
									color: "var(--ink-dim)",
									marginBottom: 24,
									maxWidth: 480
								},
								children: "Lore has built a persistent knowledge graph. You can now interrogate its entire history across infinite sessions."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									gap: 12
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn-primary",
									onClick: () => navigate(`/chat/${status.repo_id}`),
									children: "Open Chat →"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn-secondary",
									onClick: () => navigate(`/memory/${status.repo_id}`),
									children: "View Graph"
								})]
							})
						]
					})]
				}),
				phase === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SpecBox, {
					label: "Error",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "t-body-sm",
						style: {
							color: "var(--error)",
							marginBottom: 16
						},
						children: errorMsg
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn-ghost",
						onClick: () => {
							setPhase("input");
							setLogs([]);
						},
						children: "Try Again"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: AnalyzePage_module_default.infoGrid,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecBox, {
						label: "What gets ingested",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "t-body-sm",
							style: {
								color: "var(--ink-dim)",
								lineHeight: 1.65
							},
							children: "All commit messages, pull request titles and bodies, issue descriptions and comment threads, and repository README."
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SpecBox, {
						label: "How memory works",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "t-body-sm",
							style: {
								color: "var(--ink-dim)",
								lineHeight: 1.65
							},
							children: "Cognee structures everything into a hybrid graph-vector store. Relationships between contributors, decisions, and code are permanently mapped."
						})
					})]
				})
			]
		})]
	});
}
var SplitComponent = AnalyzePage;
//#endregion
export { SplitComponent as component };
