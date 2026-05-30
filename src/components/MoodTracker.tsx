"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { emotions, type Emotion, type MoodEntryView, type MoodTrendPoint } from "../lib/mood";

type MoodPayload = {
  entries: MoodEntryView[];
  trend: MoodTrendPoint[];
};

const today = new Date().toISOString().slice(0, 10);

export function MoodTracker() {
  const [date, setDate] = useState(today);
  const [emotion, setEmotion] = useState<Emotion>("平静");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [range, setRange] = useState<7 | 30>(7);
  const [entries, setEntries] = useState<MoodEntryView[]>([]);
  const [trend, setTrend] = useState<MoodTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const chartData = useMemo(
    () =>
      trend.map((point) => ({
        ...point,
        label: point.date.slice(5),
      })),
    [trend],
  );

  const loadMoodEntries = useCallback(async (nextRange: 7 | 30) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/mood?range=${nextRange}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | MoodPayload
        | { error?: string }
        | null;

      if (!response.ok || !data || !("entries" in data)) {
        throw new Error(
          data && "error" in data && data.error
            ? data.error
            : "读取心情记录失败。",
        );
      }

      setEntries(data.entries);
      setTrend(data.trend);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取心情记录失败。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMoodEntries(range);
  }, [loadMoodEntries, range]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          emotion,
          intensity,
          note,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { entry?: MoodEntryView; error?: string }
        | null;

      if (!response.ok || !data?.entry) {
        throw new Error(data?.error ?? "保存心情记录失败。");
      }

      setNote("");
      await loadMoodEntries(range);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存心情记录失败。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError("");

    try {
      const response = await fetch(`/api/mood/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "删除心情记录失败。");
      }

      await loadMoodEntries(range);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "删除心情记录失败。",
      );
    }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <p className="text-sm font-medium text-teal-700">心情记录</p>
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">自我观察</h1>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            心情记录仅用于用户自我观察，不构成心理诊断；这里只保存你主动提交的记录。
          </p>
        </div>
      </section>

      <form
        className="space-y-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-800">日期</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600"
              max={today}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-stone-800">强度</span>
            <input
              className="mt-2 w-full accent-teal-700"
              max={5}
              min={1}
              onChange={(event) => setIntensity(Number(event.target.value))}
              type="range"
              value={intensity}
            />
            <span className="mt-1 block text-sm text-stone-600">
              {intensity} / 5
            </span>
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-stone-800">情绪</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {emotions.map((item) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  emotion === item
                    ? "border-teal-700 bg-teal-50 text-teal-900"
                    : "border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
                key={item}
                onClick={() => setEmotion(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-stone-800">备注</span>
          <textarea
            className="mt-2 h-24 w-full resize-none rounded-md border border-stone-300 bg-white p-3 text-sm outline-none focus:border-teal-600"
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="可选：写一点触发因素、身体状态或想记住的事"
            value={note}
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        <button
          className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "保存中" : "保存心情记录"}
        </button>
      </form>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-stone-950">趋势</h2>
          <div className="flex rounded-md border border-stone-300 p-1 text-sm">
            {[7, 30].map((item) => (
              <button
                className={`rounded px-3 py-1 ${
                  range === item ? "bg-stone-950 text-white" : "text-stone-700"
                }`}
                key={item}
                onClick={() => setRange(item as 7 | 30)}
                type="button"
              >
                {item}天
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData} margin={{ left: -24, right: 8, top: 8 }}>
              <CartesianGrid stroke="#e7e5e4" strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} stroke="#78716c" />
              <YAxis
                allowDecimals={false}
                domain={[1, 5]}
                fontSize={12}
                stroke="#78716c"
              />
              <Tooltip />
              <Line
                connectNulls
                dataKey="intensity"
                dot={{ r: 3 }}
                stroke="#0f766e"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-stone-950">最近记录</h2>
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-sm text-stone-500">正在读取...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-stone-500">还没有心情记录。</p>
          ) : (
            entries.map((entry) => (
              <article
                className="rounded-md border border-stone-200 p-3"
                key={entry.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-950">
                      {entry.date} · {entry.emotion} · {entry.intensity}/5
                    </p>
                    {entry.note ? (
                      <p className="mt-1 text-sm leading-6 text-stone-700">
                        {entry.note}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="shrink-0 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
                    onClick={() => void handleDelete(entry.id)}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
