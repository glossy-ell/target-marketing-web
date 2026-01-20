import { NextResponse } from "next/server";
import { isDevDB } from "lib/db";

export async function GET() {
  return NextResponse.json({ isDevDB });
}