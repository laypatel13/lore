import { createFileRoute } from "@tanstack/react-router";
import AnalyzePage from "@/pages/AnalyzePage";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Open a Case · Lore" },
      {
        name: "description",
        content:
          "Point Lore at any public GitHub repository to build a persistent Cognee knowledge graph.",
      },
    ],
  }),
  component: AnalyzePage,
});
