import { redirect } from "next/navigation";
import type { UIMessage } from "ai";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CoachChat } from "@/components/candidate/coach-chat";
import { createClient } from "@/lib/supabase/server";

export default async function CareerCoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: conversation } = await supabase
    .from("coach_conversations")
    .select("id")
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!conversation) {
    const { data: newConversation } = await supabase
      .from("coach_conversations")
      .insert({ candidate_id: user.id, title: "Career Coach" })
      .select("id")
      .single();
    conversation = newConversation;
  }

  const { data: messageRows } = conversation
    ? await supabase
        .from("coach_messages")
        .select("id, role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const initialMessages: UIMessage[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
  }));

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title="Career Coach"
        description="Charlá sobre tu perfil, tu búsqueda y tu estrategia de carrera con IA."
      />
      <Card>
        <CardContent>
          {conversation ? (
            <CoachChat conversationId={conversation.id} initialMessages={initialMessages} />
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
