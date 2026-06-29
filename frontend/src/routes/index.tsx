import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/pages/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lore — Your codebase remembers. Finally." },
      {
        name: "description",
        content:
          "Lore gives your codebase a persistent memory. Ingest commits, PRs, and issues into a Cognee knowledge graph and interrogate the past, forever.",
      },
      { property: "og:title", content: "Lore — Your codebase remembers." },
      {
        property: "og:description",
        content: "A persistent intelligence layer for any GitHub repository.",
      },
    ],
  }),
  component: LandingPage,
});
