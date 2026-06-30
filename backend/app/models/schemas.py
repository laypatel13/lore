from pydantic import BaseModel
from typing import Optional

class IngestRequest(BaseModel):
    repo_url: str
    include_commits: bool = True
    include_prs: bool = True
    include_issues: bool = True
    graph_mode: bool = False   # False = fast/local vector mode (demo default), True = full Cognee graph (needs LLM quota)

class IngestStatus(BaseModel):
    repo_id: str
    status: str                  # pending | ingesting | complete | error
    commits: int = 0
    prs: int = 0
    issues: int = 0
    files_discovered: int = 0    # NEW: how many source files were found
    chunks: int = 0              # NEW: how many text chunks were generated
    docs_stored: int = 0         # NEW: how many chunks were successfully stored
    graph_mode: bool = False     # NEW: whether full Cognee graph extraction ran
    nodes: int = 0
    message: str = ""

class QueryRequest(BaseModel):
    repo_id: str
    question: str

class Source(BaseModel):
    type: str
    id: str
    text: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
    nodes_traversed: int = 0

class ForgetRequest(BaseModel):
    repo_id: str
    dataset: Optional[str] = None

class MemoryStats(BaseModel):
    repo_id: str
    total_nodes: int
    total_edges: int
    commits: int
    prs: int
    issues: int
    files: int = 0
    chunks: int = 0
    last_updated: str
