import { describe, expect, it } from "vitest";
import { analyzeImage } from "@/lib/image-scoring";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ioAAAAASUVORK5CYII=";

function png1x1Bytes(): Uint8Array {
  return Uint8Array.from(Buffer.from(PNG_1X1_BASE64, "base64"));
}

describe("analyzeImage", () => {
  it("deve penalizar print com baixa resolução e linguagem de urgência", () => {
    const result = analyzeImage({
      fileName: "comprovante_pix_urgente.png",
      mimeType: "image/png",
      fileSizeBytes: png1x1Bytes().byteLength,
      bytes: png1x1Bytes(),
      observedText: "URGENTE: sua conta foi bloqueada, confirme sua senha",
    });

    expect(result.score).toBeLessThan(50);
    expect(result.riskLevel).toBe("high");
    expect(result.metadata.width).toBe(1);
    expect(result.metadata.height).toBe(1);
  });

  it("deve sugerir informar texto quando o campo não é enviado", () => {
    const result = analyzeImage({
      fileName: "print.png",
      mimeType: "image/png",
      fileSizeBytes: png1x1Bytes().byteLength,
      bytes: png1x1Bytes(),
    });

    expect(
      result.recommendations.some((tip) =>
        tip.includes("Informe o texto principal do print"),
      ),
    ).toBe(true);
  });
});
