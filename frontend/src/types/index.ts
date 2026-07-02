export interface IngestRequest {
  repo_url: string
  include_commits: boolean
  include_prs: boolean
  include_issues: boolean
  graph_mode: boolean
  llm_provider?: 'ollama' | 'groq'   // only used when graph_mode=true
}

export interface IngestStatus {
  repo_id: string
  status: 'pending' | 'ingesting' | 'complete' | 'error'
  commits: number
  prs: number
  issues: number
  files_discovered: number   // NEW
  chunks: number             // NEW
  docs_stored: number        // NEW
  nodes: number
  message: string
  llm_provider?: 'ollama' | 'groq'
}

export interface Source {
  type: string
  id: string
  text: string
}

export interface QueryRequest {
  repo_id: string
  question: string
}

export interface QueryResponse {
  answer: string
  sources: Source[]
  nodes_traversed: number
}

export interface MemoryStats {
  repo_id: string
  total_nodes: number
  total_edges: number
  commits: number
  prs: number
  issues: number
  files?: number     // NEW
  chunks?: number    // NEW
  last_updated: string
  graph_mode: boolean  // NEW: tells frontend whether a real Cognee graph exists
}

// Real Cognee-extracted graph (only populated when graph_mode=True)
export interface RealGraphNode {
  id: string
  label: string
  type: string
}

export interface RealGraphEdge {
  source: string
  target: string
  label: string
}

export interface GraphApiResponse {
  graph_mode: boolean
  nodes: RealGraphNode[]
  edges: RealGraphEdge[]
}

export interface Message {
  id: string
  role: 'user' | 'lore'
  content: string
  sources?: Source[]
  timestamp: Date
}

export interface GraphNode {
  id: string
  label: string
  type: 'commit' | 'pr' | 'issue' | 'contributor' | 'decision' | 'file'
  x: string
  y: string
}