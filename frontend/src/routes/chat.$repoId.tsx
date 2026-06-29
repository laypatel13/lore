import { createFileRoute } from "@tanstack/react-router";
import ChatPage from "@/pages/ChatPage";

export const Route = createFileRoute("/chat/$repoId")({
  head: () => ({
    meta: [
      { title: "Chat · Lore" },
      {
        name: "description",
        content: "Interrogate your codebase's persistent memory.",
      },
    ],
  }),
  component: ChatPage,
});
