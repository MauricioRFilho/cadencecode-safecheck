import { describe, expect, it } from "vitest";
import { analyzeUrl } from "@/lib/url-scoring";

describe("analyzeUrl", () => {
  it("deve reconhecer domínio oficial brasileiro confiável", () => {
    const result = analyzeUrl("https://www.gov.br");
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.factors.some((factor) => factor.code === "trusted_br_domain")).toBe(
      true,
    );
  });

  it("deve penalizar link suspeito com múltiplos sinais", () => {
    const result = analyzeUrl("http://bit.ly/login?senha=1234567890");
    expect(result.score).toBeLessThanOrEqual(55);
    expect(["high", "medium"]).toContain(result.riskLevel);
    expect(result.factors.some((factor) => factor.code === "http_only")).toBe(true);
    expect(result.factors.some((factor) => factor.code === "looks_like_shortener")).toBe(
      true,
    );
  });

  it("deve detectar impersonação de marca brasileira", () => {
    const result = analyzeUrl("https://govbr-seguro-acesso.com");
    expect(
      result.factors.some((factor) => factor.code === "br_brand_impersonation"),
    ).toBe(true);
    expect(result.score).toBeLessThanOrEqual(75);
  });
});
