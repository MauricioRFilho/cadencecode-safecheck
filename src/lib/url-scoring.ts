import {
  BRAND_IMPERSONATION_RULES,
  BR_TRUSTED_DOMAIN_SUFFIXES,
  BR_TRUSTED_EXACT_DOMAINS,
} from "@/lib/br-threat-intel";

export type RiskLevel = "low" | "medium" | "high";

export type ScoreFactor = {
  code: string;
  label: string;
  impact: number;
  details: string;
};

export type UrlAnalysis = {
  normalizedUrl: string;
  score: number;
  riskLevel: RiskLevel;
  factors: ScoreFactor[];
  recommendations: string[];
};

type UrlHeuristic = {
  code: string;
  label: string;
  impact: number;
  when: (value: URL, rawInput: string) => boolean;
  details: (value: URL) => string;
};

function isTrustedBrDomain(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BR_TRUSTED_EXACT_DOMAINS.includes(host)) return true;
  return BR_TRUSTED_DOMAIN_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function hasLikelyBrBrandImpersonation(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const labels = host.split(".");
  const root = labels.slice(-2).join(".");

  for (const [brandKey, officialDomains] of Object.entries(
    BRAND_IMPERSONATION_RULES,
  )) {
    if (!host.includes(brandKey)) continue;
    if (!officialDomains.some((official) => host === official || root === official)) {
      return true;
    }
  }

  return false;
}

const SUSPICIOUS_TLDS = new Set([
  "zip",
  "click",
  "top",
  "gq",
  "work",
  "rest",
  "xyz",
]);

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "cutt.ly",
  "shorturl.at",
  "goo.gl",
];

const heuristics: UrlHeuristic[] = [
  {
    code: "http_only",
    label: "URL sem HTTPS",
    impact: 25,
    when: (url) => url.protocol !== "https:",
    details: () => "A conexão não usa HTTPS, aumentando o risco de interceptação.",
  },
  {
    code: "has_ip_host",
    label: "Host em formato de IP",
    impact: 18,
    when: (url) => /^(\d{1,3}\.){3}\d{1,3}$/.test(url.hostname),
    details: () => "Links legítimos costumam usar domínio em vez de IP numérico.",
  },
  {
    code: "suspicious_tld",
    label: "TLD com histórico de abuso",
    impact: 12,
    when: (url) => SUSPICIOUS_TLDS.has(url.hostname.split(".").at(-1) ?? ""),
    details: (url) => `O TLD .${url.hostname.split(".").at(-1)} exige verificação extra.`,
  },
  {
    code: "too_many_subdomains",
    label: "Muitos subdomínios",
    impact: 12,
    when: (url) => url.hostname.split(".").length >= 4,
    details: (url) =>
      `O host ${url.hostname} possui muitos níveis e pode mascarar o domínio real.`,
  },
  {
    code: "contains_at_symbol",
    label: "URL contém @",
    impact: 15,
    when: (_url, rawInput) => rawInput.includes("@"),
    details: () => "URLs com @ podem ocultar o destino real do link.",
  },
  {
    code: "looks_like_shortener",
    label: "Encurtador de URL",
    impact: 10,
    when: (url) => SHORTENERS.includes(url.hostname.toLowerCase()),
    details: () => "Links encurtados escondem o endereço final.",
  },
  {
    code: "credential_bait_words",
    label: "Termos de urgência/credencial",
    impact: 12,
    when: (url) =>
      /(login|verify|update|secure|conta|senha|pix|suporte|banco)/i.test(
        decodeURIComponent(url.pathname + url.search),
      ),
    details: () =>
      "A URL contém palavras comuns em tentativas de phishing e engenharia social.",
  },
  {
    code: "excessive_query",
    label: "Parâmetros excessivos",
    impact: 8,
    when: (url) => url.search.length > 80,
    details: () =>
      "Quantidade elevada de parâmetros pode indicar rastreamento ou ofuscação.",
  },
  {
    code: "br_brand_impersonation",
    label: "Possível impersonação de marca/órgão brasileiro",
    impact: 30,
    when: (url) => hasLikelyBrBrandImpersonation(url.hostname),
    details: () =>
      "Domínio cita marca ou órgão nacional, mas não corresponde ao domínio oficial esperado.",
  },
  {
    code: "trusted_br_domain",
    label: "Domínio oficial brasileiro reconhecido",
    impact: -10,
    when: (url) => isTrustedBrDomain(url.hostname),
    details: () => "O domínio corresponde a padrão oficial brasileiro conhecido.",
  },
];

function toRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

function buildRecommendations(factors: ScoreFactor[], score: number): string[] {
  const recommendations: string[] = [];

  if (factors.some((f) => f.code === "http_only")) {
    recommendations.push("Evite inserir dados pessoais em sites sem HTTPS.");
  }

  if (factors.some((f) => f.code === "looks_like_shortener")) {
    recommendations.push("Expanda o link encurtado antes de abrir.");
  }

  if (factors.some((f) => f.code === "credential_bait_words")) {
    recommendations.push("Confirme no canal oficial da empresa antes de prosseguir.");
  }

  if (factors.some((f) => f.code === "br_brand_impersonation")) {
    recommendations.push(
      "No Brasil, confira se órgãos públicos usam domínio .gov.br e bancos usam domínio oficial da instituição.",
    );
  }

  if (score < 50) {
    recommendations.push("Não realize pagamentos nem login nesse link até validar a origem.");
  } else if (score < 80) {
    recommendations.push("Confira o domínio letra por letra e busque avaliações externas.");
  } else {
    recommendations.push("Risco baixo, mas mantenha verificação básica antes de compartilhar dados.");
  }

  return recommendations;
}

export function analyzeUrl(input: string): UrlAnalysis {
  const raw = input.trim();
  const prefixed = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = new URL(prefixed);

  const factors = heuristics
    .filter((rule) => rule.when(parsed, raw))
    .map<ScoreFactor>((rule) => ({
      code: rule.code,
      label: rule.label,
      impact: rule.impact,
      details: rule.details(parsed),
    }));

  const totalImpact = factors.reduce((acc, current) => acc + current.impact, 0);
  const score = Math.max(0, Math.min(100, 100 - totalImpact));

  return {
    normalizedUrl: parsed.toString(),
    score,
    riskLevel: toRiskLevel(score),
    factors,
    recommendations: buildRecommendations(factors, score),
  };
}
