import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    filename: file.name,
    size: file.size,
    type: file.type,
  });
}
