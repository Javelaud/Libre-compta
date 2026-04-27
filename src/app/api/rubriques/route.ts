import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rubriques = await prisma.rubrique2035.findMany({
    orderBy: { code: "asc" },
  });
  return NextResponse.json(rubriques);
}
