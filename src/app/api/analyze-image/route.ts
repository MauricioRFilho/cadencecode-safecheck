import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/image-scoring";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const observedTextValue = formData.get("observedText");
  const observedText =
    typeof observedTextValue === "string" ? observedTextValue : "";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Envie um arquivo de imagem no campo 'file'." },
      { status: 400 },
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use PNG, JPEG ou WEBP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Arquivo excede 8MB. Envie uma imagem menor." },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const result = analyzeImage({
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      bytes,
      observedText,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar a imagem enviada." },
      { status: 400 },
    );
  }
}
