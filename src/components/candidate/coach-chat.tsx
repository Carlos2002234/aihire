"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Send, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { cn } from "@/lib/utils";

interface CoachMessageMetadata {
  createdAt: string;
}

const SUGGESTED_PROMPTS = [
  "¿Qué skills me faltan para roles senior en mi área?",
  "Ayudame a prepararme para mi próxima entrevista",
  "Revisá mi perfil y decime qué mejorar primero",
  "¿Cómo puedo destacar más en mis próximas aplicaciones?",
];

function messageText(message: UIMessage<CoachMessageMetadata>): string {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-419", { hour: "2-digit", minute: "2-digit" });
}

function AssistantAvatar() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Bot className="size-4" />
    </span>
  );
}

function CoachChat({
  conversationId,
  initialMessages,
  fullName,
  avatarUrl,
}: {
  conversationId: string;
  initialMessages: UIMessage<CoachMessageMetadata>[];
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, error, stop } = useChat<UIMessage<CoachMessageMetadata>>({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/coach" }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || status === "submitted" || status === "streaming") return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitText(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitText(input);
    }
  }

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[45vh] flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">¿Por dónde empezamos?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tu coach ya conoce tu Career Passport — probá con una de estas.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submitText(prompt)}
                  className="rounded-lg border border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === "user";
          const createdAt = message.metadata?.createdAt;
          return (
            <div key={message.id} className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
              {isUser ? (
                <PersonAvatar name={fullName} avatarUrl={avatarUrl} size="size-8" />
              ) : (
                <AssistantAvatar />
              )}
              <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm",
                    isUser
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{messageText(message)}</p>
                  ) : (
                    <div className="flex flex-col gap-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown
                        components={{
                          p: (props) => <p className="leading-relaxed" {...props} />,
                          ul: (props) => <ul className="list-disc space-y-1 pl-4" {...props} />,
                          ol: (props) => <ol className="list-decimal space-y-1 pl-4" {...props} />,
                          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                          a: (props) => (
                            <a
                              className="text-primary underline underline-offset-2"
                              target="_blank"
                              rel="noreferrer"
                              {...props}
                            />
                          ),
                          code: (props) => (
                            <code className="rounded bg-background px-1 py-0.5 text-xs" {...props} />
                          ),
                        }}
                      >
                        {messageText(message)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                {createdAt && <span className="px-1 text-[10px] text-muted-foreground">{formatTime(createdAt)}</span>}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex items-end gap-2">
            <AssistantAvatar />
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">
            Algo falló y tu career coach no pudo responder. Probá de nuevo en un momento.
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-4 flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-lg"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          placeholder="Preguntale algo a tu career coach…"
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {isBusy ? (
          <Button type="button" variant="outline" size="icon" onClick={stop} aria-label="Detener">
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Enviar">
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

export { CoachChat };
export type { CoachMessageMetadata };
