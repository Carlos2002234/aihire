import { redirect } from "next/navigation";
import type { UIMessage } from "ai";

import { PageHeader } from "@/components/ui/page-header";
import { CoachChat, type CoachMessageMetadata } from "@/components/candidate/coach-chat";
import { createClient } from "@/lib/supabase/server";

export default async function CareerCoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

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
        .select("id, role, content, created_at")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const initialMessages: UIMessage<CoachMessageMetadata>[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text", text: m.content }],
    metadata: { createdAt: m.created_at },
  }));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6">
      <PageHeader
        title="Career Coach"
        description="Charlá sobre tu perfil, tu búsqueda y tu estrategia de carrera con IA — basado en tu Career Passport."
      />
      {conversation ? (
        <CoachChat
          conversationId={conversation.id}
          initialMessages={initialMessages}
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      ) : null}
    </main>
  );
}
