import { imageSize } from "image-size";

export type ImageRiskLevel = "low" | "medium" | "high";

export type ImageScoreFactor = {
  code: string;
  label: string;
  impact: number;
  details: string;
};

export type ImageAnalysis = {
  score: number;
  riskLevel: ImageRiskLevel;
  factors: ImageScoreFactor[];
  recommendations: string[];
  metadata: {
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    width: number | null;
    height: number | null;
  };
};

type ImageInput = {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
  observedText?: string;
};

function riskLevelFromScore(score: number): ImageRiskLevel {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

export function analyzeImage(input: ImageInput): ImageAnalysis {
  const dimensions = imageSize(Buffer.from(input.bytes));
  const width = dimensions.width ?? null;
  const height = dimensions.height ?? null;
  const observed = input.observedText?.trim().toLowerCase() ?? "";
  const factors: ImageScoreFactor[] = [];

  if (width && height) {
    const megapixels = (width * height) / 1_000_000;
    const aspectRatio = width / height;

    if (megapixels < 0.15) {
      factors.push({
        code: "very_low_resolution",
        label: "Resolução muito baixa",
        impact: 20,
        details: "Imagens muito pequenas podem esconder detalhes importantes.",
      });
    }

    if (Math.min(width, height) < 400) {
      factors.push({
        code: "small_short_side",
        label: "Dimensão curta muito pequena",
        impact: 12,
        details: "Prints de baixa dimensão dificultam validar autenticidade.",
      });
    }

    if (aspectRatio > 2.4 || aspectRatio < 0.45) {
      factors.push({
        code: "unusual_aspect_ratio",
        label: "Proporção incomum",
        impact: 9,
        details: "A proporção da imagem foge do padrão de capturas comuns.",
      });
    }
  }

  if (input.fileSizeBytes < 40_000) {
    factors.push({
      code: "very_small_file",
      label: "Arquivo muito leve",
      impact: 8,
      details: "Compressão agressiva pode ocultar elementos visuais suspeitos.",
    });
  }

  if (/(comprovante|pix|urgente|atualiza|senha|seguranca|banco)/i.test(input.fileName)) {
    factors.push({
      code: "suspicious_filename",
      label: "Nome de arquivo sensível",
      impact: 8,
      details: "Nome contém termos comuns em fraudes financeiras e de conta.",
    });
  }

  if (observed) {
    if (/(urgente|imediato|expira|bloqueado|suspensa|risco|multa)/i.test(observed)) {
      factors.push({
        code: "urgency_language",
        label: "Linguagem de urgência",
        impact: 16,
        details: "Texto informado contém gatilhos típicos de engenharia social.",
      });
    }

    if (/(senha|token|codigo|c[oó]digo|confirme|verifique|login)/i.test(observed)) {
      factors.push({
        code: "credential_request",
        label: "Pedido de credencial",
        impact: 18,
        details: "Solicitação de autenticação em print exige validação reforçada.",
      });
    }

    if (/(bit\.ly|tinyurl|cutt\.ly|t\.co|goo\.gl)/i.test(observed)) {
      factors.push({
        code: "short_url_in_text",
        label: "Link encurtado no conteúdo",
        impact: 12,
        details: "Links encurtados dificultam confirmar o destino real.",
      });
    }
  }

  const score = Math.max(
    0,
    Math.min(
      100,
      100 - factors.reduce((sum, factor) => sum + factor.impact, 0),
    ),
  );

  const recommendations: string[] = [];
  if (!observed) {
    recommendations.push("Informe o texto principal do print para uma análise mais completa.");
  }
  if (score < 50) {
    recommendations.push("Não faça pagamentos nem compartilhe dados antes de validar a origem.");
  } else if (score < 80) {
    recommendations.push("Confirme a mensagem com o canal oficial da instituição.");
  } else {
    recommendations.push("Risco baixo no print, mas mantenha validação básica da fonte.");
  }
  recommendations.push("Cheque erros de ortografia, tom de urgência e pedidos de credencial.");

  return {
    score,
    riskLevel: riskLevelFromScore(score),
    factors,
    recommendations,
    metadata: {
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      width,
      height,
    },
  };
}
