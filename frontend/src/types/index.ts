export interface IngestRequest {
  repo_url: string
  include_commits: boolean
  include_prs: boolean
  include_issues: boolean
}

export interface IngestStatus {
  repo_id: string
  status: 'pending' | 'ingesting' | 'complete' | 'error'
  commits: number
  prs: number
  issues: number
  nodes: number
  message: string
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
  last_updated: string
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
  type: 'commit' | 'pr' | 'issue' | 'contributor' | 'decision'
  x: string
  y: string
}
