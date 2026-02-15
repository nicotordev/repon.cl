import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Use backend API for voice" },
    { status: 501 }
  );
}
