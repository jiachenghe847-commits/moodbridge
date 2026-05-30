import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import {
  coerceRange,
  createRecentDateKeys,
  isEmotion,
  normalizeDate,
  toDateKey,
  type MoodEntryView,
  type MoodTrendPoint,
} from "../../../lib/mood";

type MoodRequestBody = {
  date?: unknown;
  emotion?: unknown;
  intensity?: unknown;
  note?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function toView(entry: {
  id: string;
  createdAt: Date;
  date: Date;
  emotion: string;
  intensity: number;
  note: string;
}): MoodEntryView {
  return {
    id: entry.id,
    createdAt: entry.createdAt.toISOString(),
    date: toDateKey(entry.date),
    emotion: entry.emotion as MoodEntryView["emotion"],
    intensity: entry.intensity,
    note: entry.note,
  };
}

export async function GET(request: NextRequest) {
  const range = coerceRange(request.nextUrl.searchParams.get("range"));
  const dateKeys = createRecentDateKeys(range);
  const startDate = new Date(`${dateKeys[0]}T00:00:00.000Z`);

  const [entries, trendEntries] = await Promise.all([
    prisma.moodEntry.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.moodEntry.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const grouped = new Map<string, number[]>();

  for (const entry of trendEntries) {
    const key = toDateKey(entry.date);
    const values = grouped.get(key) ?? [];
    values.push(entry.intensity);
    grouped.set(key, values);
  }

  const trend: MoodTrendPoint[] = dateKeys.map((date) => {
    const values = grouped.get(date);
    const intensity =
      values && values.length > 0
        ? Number(
            (
              values.reduce((total, value) => total + value, 0) / values.length
            ).toFixed(2),
          )
        : null;

    return { date, intensity };
  });

  return NextResponse.json({
    entries: entries.map(toView),
    trend,
  });
}

export async function POST(request: NextRequest) {
  let body: MoodRequestBody;

  try {
    body = (await request.json()) as MoodRequestBody;
  } catch {
    return errorResponse("请求格式不正确。", 400);
  }

  const date = normalizeDate(body.date);

  if (!date) {
    return errorResponse("请选择有效日期。", 400);
  }

  if (!isEmotion(body.emotion)) {
    return errorResponse("请选择有效情绪类型。", 400);
  }

  if (
    typeof body.intensity !== "number" ||
    !Number.isInteger(body.intensity) ||
    body.intensity < 1 ||
    body.intensity > 5
  ) {
    return errorResponse("情绪强度必须是 1 到 5 的整数。", 400);
  }

  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  const entry = await prisma.moodEntry.create({
    data: {
      date,
      emotion: body.emotion,
      intensity: body.intensity,
      note,
    },
  });

  return NextResponse.json({ entry: toView(entry) }, { status: 201 });
}
