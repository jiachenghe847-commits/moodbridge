export const emotions = ["开心", "平静", "焦虑", "低落", "愤怒", "疲惫"] as const;

export type Emotion = (typeof emotions)[number];

export type MoodEntryView = {
  id: string;
  createdAt: string;
  date: string;
  emotion: Emotion;
  intensity: number;
  note: string;
};

export type MoodTrendPoint = {
  date: string;
  intensity: number | null;
};

export function isEmotion(value: unknown): value is Emotion {
  return typeof value === "string" && emotions.includes(value as Emotion);
}

export function normalizeDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createRecentDateKeys(days: number) {
  const today = new Date();
  const keys: string[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - index,
      ),
    );
    keys.push(toDateKey(date));
  }

  return keys;
}

export function coerceRange(value: string | null) {
  return value === "30" ? 30 : 7;
}
