import { NextResponse } from "next/server";
import { analyzeUrl } from "@/lib/url-scoring";

type RequestBody = {
  url?: string;
};

export async function POST(request: Request) {
  let payload: RequestBody;

  try {
    payload = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Corpo inválido. Envie JSON com o campo 'url'." },
      { status: 400 },
    );
  }

  const rawUrl = payload.url?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: "Informe uma URL para análise." },
      { status: 400 },
    );
  }

  try {
    const analysis = analyzeUrl(rawUrl);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "URL inválida. Verifique o formato e tente novamente." },
      { status: 400 },
    );
  }
}
