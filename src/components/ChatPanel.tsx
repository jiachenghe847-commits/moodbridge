"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { GuidedRiskPanel } from "./GuidedRiskPanel";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatMode = "chat" | "guidedRisk";

type ChatPanelProps = {
  compact?: boolean;
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

export function ChatPanel({ compact = false }: ChatPanelProps) {
  const [mode, setMode] = useState<ChatMode>("chat");
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
      const nextMessages = [...messages, userMessage];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
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
    <div
      className={`flex min-h-0 flex-col gap-4 ${
        compact
          ? "min-h-[72vh] lg:min-h-[760px]"
          : "mx-auto min-h-[calc(100svh-153px)] max-w-2xl"
      }`}
    >
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

      <div className="grid grid-cols-2 rounded-lg border border-stone-200 bg-white p-1 text-sm shadow-sm">
        <button
          className={`rounded-md px-3 py-2 font-medium transition ${
            mode === "chat"
              ? "bg-stone-950 text-white"
              : "text-stone-700 hover:bg-stone-50"
          }`}
          onClick={() => setMode("chat")}
          type="button"
        >
          自由聊天
        </button>
        <button
          className={`rounded-md px-3 py-2 font-medium transition ${
            mode === "guidedRisk"
              ? "bg-stone-950 text-white"
              : "text-stone-700 hover:bg-stone-50"
          }`}
          onClick={() => setMode("guidedRisk")}
          type="button"
        >
          风险引导
        </button>
      </div>

      <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        当前结果只是风险提示，不是诊断；问卷结果也不是诊断。本项目不替代医生、心理咨询师或紧急救援。
        如有紧急危险，请联系 110 / 120 或身边可信任的人。
      </p>

      {mode === "guidedRisk" ? <GuidedRiskPanel /> : null}

      <section
        className={`min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ${
          mode === "chat" ? "flex" : "hidden"
        }`}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
          {messages.map((message) => (
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={message.id}
            >
              <div
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[82%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-teal-700 text-white"
                    : "rounded-bl-md bg-stone-100 text-stone-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 text-sm text-stone-600">
                心桥正在回应...
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          className="sticky bottom-0 border-t border-stone-200 bg-stone-50 p-3"
          onSubmit={handleSubmit}
        >
          <label className="block">
            <span className="sr-only">输入消息</span>
            <textarea
              className="max-h-32 min-h-20 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-base leading-6 outline-none transition placeholder:text-stone-400 focus:border-teal-600 disabled:bg-stone-100"
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

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-stone-500">
              空输入不会发送，发送时会暂时锁定按钮。
            </p>
            <button
              className="h-11 rounded-md bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 sm:min-w-24"
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
