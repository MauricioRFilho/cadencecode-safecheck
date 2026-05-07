export const BR_TRUSTED_DOMAIN_SUFFIXES = [
  ".gov.br",
  ".jus.br",
  ".leg.br",
  ".mp.br",
];

export const BR_TRUSTED_EXACT_DOMAINS = [
  "gov.br",
  "bcb.gov.br",
  "receita.fazenda.gov.br",
  "receita.economia.gov.br",
  "correios.com.br",
  "bb.com.br",
  "itau.com.br",
  "bradesco.com.br",
  "caixa.gov.br",
  "santander.com.br",
  "nubank.com.br",
  "inter.co",
];

export const BRAND_IMPERSONATION_RULES: Record<string, string[]> = {
  govbr: ["gov.br"],
  receita: ["gov.br", "receita.fazenda.gov.br", "receita.economia.gov.br"],
  correios: ["correios.com.br", "gov.br"],
  caixa: ["caixa.gov.br"],
  bcb: ["bcb.gov.br"],
  bacen: ["bcb.gov.br"],
  bb: ["bb.com.br"],
  itau: ["itau.com.br"],
  bradesco: ["bradesco.com.br"],
  santander: ["santander.com.br"],
  nubank: ["nubank.com.br"],
};
