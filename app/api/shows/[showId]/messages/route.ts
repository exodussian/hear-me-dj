// app/api/shows/[showId]/messages/route.ts

import { NextResponse } from 'next/server';
import prisma from "../../../../../src/lib/prisma"


export async function GET(
  request: Request,
  { params }: { params: { showId: string } }
) {
  try {
    const resolvedParams = await params;
    const showId = resolvedParams.showId;

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    return NextResponse.json(show.messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}