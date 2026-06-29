import { t as axios } from "../_libs/axios+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-CKq_itpl.js
var http = axios.create({
	baseURL: "http://localhost:8000",
	headers: { "Content-Type": "application/json" }
});
var api = {
	ingest: {
		start: (req) => http.post("/ingest/", req).then((r) => r.data),
		getStatus: (repoId) => http.get(`/ingest/${repoId}/status`).then((r) => r.data)
	},
	chat: {
		query: (req) => http.post("/chat/query", req).then((r) => r.data),
		improve: (repoId) => http.post(`/chat/improve?repo_id=${repoId}`).then((r) => r.data),
		forget: (repoId) => http.delete("/chat/forget", { data: { repo_id: repoId } }).then((r) => r.data),
		stats: (repoId) => http.get(`/chat/memory/${repoId}`).then((r) => r.data)
	}
};
//#endregion
export { api as t };
