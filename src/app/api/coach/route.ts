import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { after } from "next/server";

import { fetchCandidatePassport } from "@/lib/ai/candidate";
import { buildCareerCoachContext, CAREER_COACH_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { createClient } from "@/lib/supabase/server";

// Route handler (excepción deliberada a "evitar API routes salvo webhooks"):
// useChat necesita un endpoint HTTP que devuelva un stream — un Server
// Action no puede transportar eso.
export const maxDuration = 30;

function extractText(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages, id: conversationId }: { messages: UIMessage[]; id: string } = await req.json();

  const { data: conversation } = await supabase
    .from("coach_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("candidate_id", user.id)
    .maybeSingle();
  if (!conversation) return new Response("Not found", { status: 404 });

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "user") {
    await supabase.from("coach_messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: extractText(lastMessage),
    });
  }

  const candidate = await fetchCandidatePassport(supabase, user.id);

  const result = streamText({
    model: anthropic("claude-opus-4-8"),
    system: `${CAREER_COACH_SYSTEM_PROMPT}\n\n${buildCareerCoachContext(candidate)}`,
    messages: await convertToModelMessages(messages),
    providerOptions: {
      anthropic: { thinking: { type: "adaptive" }, effort: "high" },
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: ({ messages: finalMessages }) => {
        const assistantMessage = finalMessages[finalMessages.length - 1];
        if (assistantMessage?.role === "assistant") {
          const content = extractText(assistantMessage);
          after(() =>
            supabase
              .from("coach_messages")
              .insert({ conversation_id: conversationId, role: "assistant", content })
          );
        }
      },
    }),
  });
}
