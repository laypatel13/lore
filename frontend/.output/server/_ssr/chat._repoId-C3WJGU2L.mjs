import { o as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { i as useParams$1, n as NavBar, t as Link$1 } from "./NavBar-BBkF6m3E.mjs";
import { t as api } from "./client-CKq_itpl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat._repoId-C3WJGU2L.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ChatPage_module_default = {
	chatArea: "Dqw1lW_chatArea",
	chatInput: "Dqw1lW_chatInput",
	dot: "Dqw1lW_dot",
	dots: "Dqw1lW_dots",
	evidenceEmpty: "Dqw1lW_evidenceEmpty",
	evidenceItem: "Dqw1lW_evidenceItem",
	evidenceItems: "Dqw1lW_evidenceItems",
	evidencePanel: "Dqw1lW_evidencePanel",
	evidencePanelHeader: "Dqw1lW_evidencePanelHeader",
	evidenceRow: "Dqw1lW_evidenceRow",
	inlineCode: "Dqw1lW_inlineCode",
	inputArea: "Dqw1lW_inputArea",
	inputWrap: "Dqw1lW_inputWrap",
	layout: "Dqw1lW_layout",
	loreBadge: "Dqw1lW_loreBadge",
	loreMsg: "Dqw1lW_loreMsg",
	loreMsgBody: "Dqw1lW_loreMsgBody",
	loreMsgMeta: "Dqw1lW_loreMsgMeta",
	loreMsgText: "Dqw1lW_loreMsgText",
	messages: "Dqw1lW_messages",
	page: "Dqw1lW_page",
	sendBtn: "Dqw1lW_sendBtn",
	sidebar: "Dqw1lW_sidebar",
	sideSection: "Dqw1lW_sideSection",
	statKey: "Dqw1lW_statKey",
	statRow: "Dqw1lW_statRow",
	suggestion: "Dqw1lW_suggestion",
	userBubble: "Dqw1lW_userBubble",
	userRow: "Dqw1lW_userRow"
};
var SUGGESTIONS = [
	"Why was this architectural decision made?",
	"Who contributed the most impactful PRs?",
	"What bugs were hardest to fix and why?",
	"How has the codebase evolved over time?"
];
function ChatPage() {
	const { repoId } = useParams$1();
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [input, setInput] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [stats, setStats] = (0, import_react.useState)(null);
	const [activeSources, setSources] = (0, import_react.useState)([]);
	const [queryCount, setQueryCount] = (0, import_react.useState)(0);
	const bottomRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!repoId) return;
		api.chat.stats(repoId).then(setStats).catch(() => {});
		setMessages([{
			id: "welcome",
			role: "lore",
			content: `Case opened. Knowledge graph loaded for \`${repoId}\`. Ask me anything about this codebase's history, decisions, or contributors.`,
			timestamp: /* @__PURE__ */ new Date()
		}]);
	}, [repoId]);
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);
	const send = async (text) => {
		const q = (text || input).trim();
		if (!q || loading || !repoId) return;
		setInput("");
		setMessages((p) => [...p, {
			id: Date.now().toString(),
			role: "user",
			content: q,
			timestamp: /* @__PURE__ */ new Date()
		}]);
		setLoading(true);
		setQueryCount((c) => c + 1);
		try {
			const res = await api.chat.query({
				repo_id: repoId,
				question: q
			});
			setMessages((p) => [...p, {
				id: (Date.now() + 1).toString(),
				role: "lore",
				content: res.answer,
				sources: res.sources,
				timestamp: /* @__PURE__ */ new Date()
			}]);
			if (res.sources?.length) setSources(res.sources);
		} catch {
			setMessages((p) => [...p, {
				id: (Date.now() + 1).toString(),
				role: "lore",
				content: "Failed to query memory. Ensure the backend is running.",
				timestamp: /* @__PURE__ */ new Date()
			}]);
		} finally {
			setLoading(false);
		}
	};
	const handleKey = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: ChatPage_module_default.page,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavBar, {
			repoId,
			repoName: `Case #${repoId?.slice(0, 8)}`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ChatPage_module_default.layout,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: ChatPage_module_default.sidebar,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ChatPage_module_default.sideSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 12 },
								children: "Suggested Queries"
							}), SUGGESTIONS.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: ChatPage_module_default.suggestion,
								onClick: () => send(q),
								children: q
							}, q))]
						}),
						stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ChatPage_module_default.sideSection,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "t-label",
								style: { marginBottom: 12 },
								children: "Case Memory"
							}), [
								["Commits", stats.commits],
								["Pull Requests", stats.prs],
								["Issues", stats.issues],
								["Graph Nodes", stats.total_nodes],
								["Queries", queryCount]
							].map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ChatPage_module_default.statRow,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: ChatPage_module_default.statKey,
									children: k
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "t-mono-xs",
									style: { color: "var(--accent)" },
									children: v
								})]
							}, k))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ChatPage_module_default.sideSection,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link$1, {
								to: `/memory/${repoId}`,
								className: "btn-ghost",
								style: {
									width: "100%",
									justifyContent: "center"
								},
								children: "View Memory Graph →"
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: ChatPage_module_default.chatArea,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ChatPage_module_default.messages,
						children: [
							messages.map((msg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: ChatPage_module_default.msgWrapper,
								children: msg.role === "user" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: ChatPage_module_default.userRow,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: ChatPage_module_default.userBubble,
										children: msg.content
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: ChatPage_module_default.loreMsg,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: ChatPage_module_default.loreMsgMeta,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: ChatPage_module_default.loreBadge,
											children: "LORE"
										}), msg.sources && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "t-mono-xs",
											style: { color: "var(--ink-ghost)" },
											children: [
												"cognee.recall() · ",
												msg.sources.length,
												" sources"
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `bp-card ${ChatPage_module_default.loreMsgBody}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: ChatPage_module_default.loreMsgText,
											children: msg.content.split("`").map((part, i) => i % 2 === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: ChatPage_module_default.inlineCode,
												children: part
											}, i) : part.split("**").map((p2, j) => j % 2 === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: p2 }, j) : p2))
										}), msg.sources && msg.sources.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: ChatPage_module_default.evidenceRow,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "t-label",
												children: "Sources"
											}), msg.sources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bp-tag",
												style: { cursor: "pointer" },
												onClick: () => setSources(msg.sources || []),
												children: [
													s.type,
													" ",
													s.id
												]
											}, s.id))]
										})]
									})]
								})
							}, msg.id)),
							loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: ChatPage_module_default.loreMsg,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: ChatPage_module_default.loreMsgMeta,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: ChatPage_module_default.loreBadge,
										children: "LORE"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "t-mono-xs",
										style: { color: "var(--ink-ghost)" },
										children: "traversing graph..."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `bp-card ${ChatPage_module_default.loreMsgBody}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: ChatPage_module_default.loreMsgText,
										style: {
											color: "var(--ink-ghost)",
											fontStyle: "italic"
										},
										children: ["Searching knowledge graph", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: ChatPage_module_default.dots,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
											]
										})]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: ChatPage_module_default.inputArea,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ChatPage_module_default.inputWrap,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: ChatPage_module_default.chatInput,
								rows: 1,
								value: input,
								onChange: (e) => setInput(e.target.value),
								onKeyDown: handleKey,
								placeholder: "Ask anything about this codebase's history..."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: ChatPage_module_default.sendBtn,
								onClick: () => send(),
								disabled: loading,
								children: "→"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "t-mono-xs",
							style: {
								color: "var(--ink-ghost)",
								marginTop: 8
							},
							children: "↵ Enter to send · Shift+↵ new line · Memory persists across sessions"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: ChatPage_module_default.evidencePanel,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ChatPage_module_default.evidencePanelHeader,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "t-label",
							children: "Evidence Panel"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: ChatPage_module_default.evidenceItems,
						children: activeSources.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ChatPage_module_default.evidenceEmpty,
							children: "Sources appear here after your first query."
						}) : activeSources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: ChatPage_module_default.evidenceItem,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-mono-xs",
									style: {
										color: "var(--accent)",
										marginBottom: 4,
										textTransform: "uppercase",
										letterSpacing: "0.08em"
									},
									children: s.type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-mono-sm",
									style: {
										color: "var(--ink)",
										marginBottom: 4
									},
									children: s.id
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "t-body-sm",
									style: { color: "var(--ink-dim)" },
									children: s.text
								})
							]
						}, s.id))
					})]
				})
			]
		})]
	});
}
var SplitComponent = ChatPage;
//#endregion
export { SplitComponent as component };
