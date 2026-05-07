import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/analyze-url/route";

describe("POST /api/analyze-url", () => {
  it("deve retornar 400 quando a URL não é enviada", async () => {
    const request = new Request("http://localhost/api/analyze-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("deve retornar análise para payload válido", async () => {
    const request = new Request("http://localhost/api/analyze-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://gov.br" }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { score: number };

    expect(response.status).toBe(200);
    expect(data.score).toBeGreaterThan(0);
  });
});
