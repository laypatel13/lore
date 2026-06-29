import axios from 'axios'
import type { IngestRequest, IngestStatus, QueryRequest, QueryResponse, MemoryStats } from '../types'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', headers: { 'Content-Type': 'application/json' } })

export const api = {
  ingest: {
    start:     (req: IngestRequest)  => http.post<IngestStatus>('/ingest/', req).then(r => r.data),
    getStatus: (repoId: string)      => http.get<IngestStatus>(`/ingest/${repoId}/status`).then(r => r.data),
  },
  chat: {
    query:   (req: QueryRequest)     => http.post<QueryResponse>('/chat/query', req).then(r => r.data),
    improve: (repoId: string)        => http.post(`/chat/improve?repo_id=${repoId}`).then(r => r.data),
    forget:  (repoId: string)        => http.delete('/chat/forget', { data: { repo_id: repoId } }).then(r => r.data),
    stats:   (repoId: string)        => http.get<MemoryStats>(`/chat/memory/${repoId}`).then(r => r.data),
  },
}
