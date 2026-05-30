import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "缺少记录 ID。" }, { status: 400 });
  }

  try {
    await prisma.moodEntry.delete({
      where: { id },
    });
  } catch {
    return NextResponse.json({ error: "记录不存在或已删除。" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
