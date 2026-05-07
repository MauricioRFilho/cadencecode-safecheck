"use client";

import { FormEvent, useMemo, useState } from "react";

type UrlAnalysis = {
  normalizedUrl: string;
  score: number;
  riskLevel: "low" | "medium" | "high";
  factors: { code: string; label: string; impact: number; details: string }[];
  recommendations: string[];
};

type ImageAnalysis = {
  score: number;
  riskLevel: "low" | "medium" | "high";
  factors: { code: string; label: string; impact: number; details: string }[];
  recommendations: string[];
  metadata: {
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    width: number | null;
    height: number | null;
  };
};

const riskLabel = {
  low: "Baixo risco",
  medium: "Atenção",
  high: "Alto risco",
} as const;

const riskClass = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
} as const;

function scoreBarClass(score: number) {
  if (score >= 80) return "bg-emerald-600";
  if (score >= 50) return "bg-amber-500";
  return "bg-rose-600";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlResult, setUrlResult] = useState<UrlAnalysis | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [observedText, setObservedText] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<ImageAnalysis | null>(null);

  const urlBarClass = useMemo(
    () => (urlResult ? scoreBarClass(urlResult.score) : "bg-slate-700"),
    [urlResult],
  );
  const imageBarClass = useMemo(
    () => (imageResult ? scoreBarClass(imageResult.score) : "bg-slate-700"),
    [imageResult],
  );

  async function onSubmitUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUrlError(null);
    setUrlResult(null);
    setUrlLoading(true);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as UrlAnalysis | { error: string };
      if (!response.ok || "error" in data) {
        setUrlError("error" in data ? data.error : "Falha ao analisar URL.");
        return;
      }
      setUrlResult(data);
    } catch {
      setUrlError("Erro de rede ao processar a análise.");
    } finally {
      setUrlLoading(false);
    }
  }

  async function onSubmitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setImageError(null);
    setImageResult(null);

    if (!imageFile) {
      setImageError("Selecione uma imagem para análise.");
      return;
    }

    setImageLoading(true);
    try {
      const body = new FormData();
      body.append("file", imageFile);
      body.append("observedText", observedText);

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as ImageAnalysis | { error: string };
      if (!response.ok || "error" in data) {
        setImageError("error" in data ? data.error : "Falha ao analisar imagem.");
        return;
      }
      setImageResult(data);
    } catch {
      setImageError("Erro de rede ao processar a análise.");
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            CadenceCode
          </p>
          <h1 className="mt-2 text-3xl font-bold">SafeCheck MVP</h1>
          <p className="mt-2 text-sm text-slate-300">
            Verificação heurística gratuita de URLs e prints (sem IA).
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
            <h2 className="text-lg font-semibold">Análise de URL</h2>
            <form onSubmit={onSubmitUrl} className="mt-3 flex flex-col gap-3">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://exemplo.com/login"
                className="h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none transition focus:border-cyan-400"
                required
              />
              <button
                type="submit"
                disabled={urlLoading}
                className="h-12 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {urlLoading ? "Analisando..." : "Analisar URL"}
              </button>
            </form>
            {urlError ? <p className="mt-3 text-sm text-rose-300">{urlError}</p> : null}

            {urlResult ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Score</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass[urlResult.riskLevel]}`}
                    >
                      {riskLabel[urlResult.riskLevel]}
                    </span>
                    <strong>{urlResult.score}%</strong>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-800">
                  <div
                    className={`h-3 rounded-full ${urlBarClass}`}
                    style={{ width: `${urlResult.score}%` }}
                  />
                </div>
                <ul className="space-y-2 text-sm">
                  {urlResult.factors.length === 0 ? (
                    <li className="rounded-xl bg-slate-950 p-3 text-slate-300">
                      Nenhum fator de risco relevante encontrado.
                    </li>
                  ) : (
                    urlResult.factors.map((factor) => (
                      <li key={factor.code} className="rounded-xl bg-slate-950 p-3">
                        <p className="font-medium">
                          {factor.label}{" "}
                          <span className="text-rose-300">(-{factor.impact} pts)</span>
                        </p>
                        <p className="mt-1 text-slate-300">{factor.details}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
            <h2 className="text-lg font-semibold">Análise de Print/Imagem</h2>
            <form onSubmit={onSubmitImage} className="mt-3 flex flex-col gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"
              />
              <textarea
                value={observedText}
                onChange={(event) => setObservedText(event.target.value)}
                placeholder="Texto visível no print (opcional): ex. sua conta será bloqueada, clique no link..."
                rows={4}
                className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm outline-none transition focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={imageLoading}
                className="h-12 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {imageLoading ? "Analisando..." : "Analisar Imagem"}
              </button>
            </form>
            {imageError ? <p className="mt-3 text-sm text-rose-300">{imageError}</p> : null}

            {imageResult ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-300">Score</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass[imageResult.riskLevel]}`}
                    >
                      {riskLabel[imageResult.riskLevel]}
                    </span>
                    <strong>{imageResult.score}%</strong>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-800">
                  <div
                    className={`h-3 rounded-full ${imageBarClass}`}
                    style={{ width: `${imageResult.score}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {imageResult.metadata.fileName} | {imageResult.metadata.mimeType} |{" "}
                  {imageResult.metadata.fileSizeBytes} bytes |{" "}
                  {imageResult.metadata.width ?? "?"}x{imageResult.metadata.height ?? "?"}
                </p>
                <ul className="space-y-2 text-sm">
                  {imageResult.factors.length === 0 ? (
                    <li className="rounded-xl bg-slate-950 p-3 text-slate-300">
                      Nenhum fator de risco relevante encontrado.
                    </li>
                  ) : (
                    imageResult.factors.map((factor) => (
                      <li key={factor.code} className="rounded-xl bg-slate-950 p-3">
                        <p className="font-medium">
                          {factor.label}{" "}
                          <span className="text-rose-300">(-{factor.impact} pts)</span>
                        </p>
                        <p className="mt-1 text-slate-300">{factor.details}</p>
                      </li>
                    ))
                  )}
                </ul>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {imageResult.recommendations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </section>
      </div>
    </main>
  );
}
