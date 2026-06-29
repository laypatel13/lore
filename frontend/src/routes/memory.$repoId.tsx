import { createFileRoute } from "@tanstack/react-router";
import MemoryPage from "@/pages/MemoryPage";

export const Route = createFileRoute("/memory/$repoId")({
  head: () => ({
    meta: [
      { title: "Memory Graph · Lore" },
      {
        name: "description",
        content: "Inspect the Cognee knowledge graph for your codebase.",
      },
    ],
  }),
  component: MemoryPage,
});
