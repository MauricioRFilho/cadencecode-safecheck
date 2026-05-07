import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/analyze-image/route";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ioAAAAASUVORK5CYII=";

function makePngFile(name = "print.png"): File {
  const bytes = Buffer.from(PNG_1X1_BASE64, "base64");
  return new File([bytes], name, { type: "image/png" });
}

describe("POST /api/analyze-image", () => {
  it("deve retornar 400 quando o arquivo não é enviado", async () => {
    const formData = new FormData();
    const request = new Request("http://localhost/api/analyze-image", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("deve retornar 400 para tipo de arquivo inválido", async () => {
    const formData = new FormData();
    formData.append("file", new File(["x"], "doc.txt", { type: "text/plain" }));
    const request = new Request("http://localhost/api/analyze-image", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("deve retornar análise para imagem válida", async () => {
    const formData = new FormData();
    formData.append("file", makePngFile("comprovante_pix.png"));
    formData.append("observedText", "urgente confirme sua senha");

    const request = new Request("http://localhost/api/analyze-image", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = (await response.json()) as {
      score: number;
      metadata: { width: number | null; height: number | null };
    };

    expect(response.status).toBe(200);
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.metadata.width).toBe(1);
    expect(data.metadata.height).toBe(1);
  });
});
