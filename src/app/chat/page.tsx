"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "你好，我是心桥。你可以用中文说说此刻的感受，我会先用支持性的方式回应你。",
  },
];

const fallbackErrorMessage =
  "抱歉，当前暂时无法获得回复。你可以稍后再试；如果你正处于紧急危险中，请立即联系当地紧急服务或身边可信任的人。";

const requestTimeoutMs = 25_000;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const trimmedInput = input.trim();
  const canSend = trimmedInput.length > 0 && !isSending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsSending(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as {
        reply?: unknown;
        error?: unknown;
      } | null;

      if (!response.ok || typeof data?.reply !== "string") {
        throw new Error(
          typeof data?.error === "string" ? data.error : fallbackErrorMessage,
        );
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof DOMException && error.name === "AbortError"
            ? "请求超时了，请稍后再试。"
            : error instanceof Error
              ? error.message
              : fallbackErrorMessage,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } finally {
      window.clearTimeout(timeout);
      setIsSending(false);
    }
  }

  function handleClear() {
    if (isSending) {
      return;
    }

    setMessages(initialMessages);
    setInput("");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-153px)] max-w-2xl flex-col gap-4">
      <section className="space-y-3">
        <p className="text-sm font-medium text-teal-700">聊天</p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">
              情绪陪伴对话
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              聊天记录当前只保存在页面状态中，刷新后会清空；不会写入数据库。
            </p>
          </div>
          <button
            className="shrink-0 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending}
            onClick={handleClear}
            type="button"
          >
            清空
          </button>
        </div>
      </section>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        本助手仅提供一般性情绪支持，不替代专业医疗或心理咨询服务。
      </p>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {messages.map((message) => (
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={message.id}
            >
              <div
                className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-teal-700 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
                心桥正在回应...
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-stone-200 bg-stone-50 p-3"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="sr-only">输入消息</span>
            <textarea
              className="max-h-32 min-h-20 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-base leading-6 outline-none transition placeholder:text-stone-400 focus:border-teal-600"
              disabled={isSending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="用中文写下你此刻想说的话"
              value={input}
            />
          </label>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">
              空输入不会发送，发送时会暂时锁定按钮。
            </p>
            <button
              className="rounded-md bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
              disabled={!canSend}
              type="submit"
            >
              {isSending ? "发送中" : "发送"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
