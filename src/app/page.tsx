"use client";

import { FormEvent, useMemo, useState } from "react";

type UrlAnalysis = {
  normalizedUrl: string;
  score: number;
  riskLevel: "low" | "medium" | "high";
  factors: { code: string; label: string; impact: number; details: string }[];
  recommendations: string[];
};

const riskLabel: Record<UrlAnalysis["riskLevel"], string> = {
  low: "Baixo risco",
  medium: "Atenção",
  high: "Alto risco",
};

const riskClass: Record<UrlAnalysis["riskLevel"], string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlAnalysis | null>(null);

  const scoreBarColor = useMemo(() => {
    if (!result) return "bg-slate-700";
    if (result.score >= 80) return "bg-emerald-600";
    if (result.score >= 50) return "bg-amber-500";
    return "bg-rose-600";
  }, [result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await response.json()) as UrlAnalysis | { error: string };
      if (!response.ok || "error" in data) {
        setError("error" in data ? data.error : "Falha ao analisar URL.");
        return;
      }

      setResult(data);
    } catch {
      setError("Erro de rede ao processar a análise.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            CadenceCode
          </p>
          <h1 className="mt-2 text-3xl font-bold">SafeCheck URL</h1>
          <p className="mt-2 text-sm text-slate-300">
            Verificação heurística gratuita de segurança para links (MVP sem IA).
          </p>
        </header>

        <section className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label htmlFor="url" className="text-sm text-slate-300">
              URL para análise
            </label>
            <input
              id="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="ex: https://exemplo.com/login"
              className="h-12 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none transition focus:border-cyan-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Analisando..." : "Analisar segurança"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {result ? (
          <section className="rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Resultado</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${riskClass[result.riskLevel]}`}
              >
                {riskLabel[result.riskLevel]}
              </span>
            </div>

            <p className="mt-2 break-all text-xs text-slate-400">
              URL normalizada: {result.normalizedUrl}
            </p>

            <div className="mt-4">
              <div className="mb-2 flex items-end justify-between">
                <p className="text-sm text-slate-300">Score de segurança</p>
                <p className="text-2xl font-bold">{result.score}%</p>
              </div>
              <div className="h-3 rounded-full bg-slate-800">
                <div
                  className={`h-3 rounded-full ${scoreBarColor}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Fatores detectados</h3>
              {result.factors.length === 0 ? (
                <p className="mt-2 text-sm text-slate-300">
                  Nenhum fator de risco relevante encontrado.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {result.factors.map((factor) => (
                    <li key={factor.code} className="rounded-xl bg-slate-950 p-3 text-sm">
                      <p className="font-medium">
                        {factor.label}{" "}
                        <span className="text-rose-300">(-{factor.impact} pts)</span>
                      </p>
                      <p className="mt-1 text-slate-300">{factor.details}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold">Recomendações</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {result.recommendations.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
