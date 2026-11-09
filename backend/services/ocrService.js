
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import fs from "fs/promises";

const MEDICAL_LABELS = [
  "hemoglobin", "haemoglobin", "packed cell volume", "pcv",
  "rbc", "mcv", "mch", "mchc", "rdw",
  "total leukocyte count", "tlc", "neutrophils",
  "lymphocytes", "monocytes", "eosinophils", "basophils",
  "platelet count", "platelets", "glucose", "creatinine",
  "cholesterol", "reference range",
];

function normalizeWord(word) {
  const text = String(word?.text ?? "").trim();
  if (!text) return null;

  const box = word.bbox ?? word.boundingBox ?? null;

  let bbox = null;
  if (box) {
    const x0 = Number(box.x0 ?? box.left);
    const y0 = Number(box.y0 ?? box.top);
    const x1 = Number(box.x1 ?? box.right);
    const y1 = Number(box.y1 ?? box.bottom);

    if ([x0, y0, x1, y1].every(Number.isFinite)) {
      bbox = { x0, y0, x1, y1 };
    }
  }

  return {
    text,
    confidence: Number.isFinite(Number(word.confidence))
      ? Number(word.confidence)
      : null,
    bbox,
  };
}

function collectBlockDetails(blocks = []) {
  const words = [];
  const lines = [];

  function walk(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node !== "object") return;

    if (
      typeof node.text === "string" &&
      node.text.trim() &&
      (node.bbox || node.boundingBox) &&
      !Array.isArray(node.words)
    ) {
      const normalized = normalizeWord(node);
      if (normalized) words.push(normalized);
    }

    if (
      typeof node.text === "string" &&
      node.text.trim() &&
      Array.isArray(node.words)
    ) {
      lines.push(node.text.trim());
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "text" || key === "bbox" || key === "boundingBox") {
        continue;
      }

      if (Array.isArray(value) || (value && typeof value === "object")) {
        walk(value);
      }
    }
  }

  walk(blocks);

  return {
    words,
    lines: [...new Set(lines)],
  };
}

async function createImageVariants(filePath) {
  const metadata = await sharp(filePath, { failOn: "none" }).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read the uploaded image dimensions.");
  }

  const targetWidth = Math.min(Math.max(metadata.width, 2400), 3600);

  const base = sharp(filePath, { failOn: "none" })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({
      width: targetWidth,
      withoutEnlargement: false,
    });

  const [clean, contrast, threshold] = await Promise.all([
    base.clone()
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer(),

    base.clone()
      .grayscale()
      .linear(1.25, -20)
      .normalize()
      .png()
      .toBuffer(),

    base.clone()
      .grayscale()
      .normalize()
      .threshold(165)
      .png()
      .toBuffer(),
  ]);

  return [
    { name: "clean", buffer: clean },
    { name: "contrast", buffer: contrast },
    { name: "threshold", buffer: threshold },
  ];
}

function countMedicalLabels(text) {
  const normalized = text.toLowerCase();

  return MEDICAL_LABELS.reduce(
    (count, label) => count + (normalized.includes(label) ? 1 : 0),
    0
  );
}

function scoreCandidate(candidate) {
  const text = candidate.text || "";
  const confidence = Number(candidate.confidence) || 0;
  const labelCount = countMedicalLabels(text);
  const numericCount = (text.match(/\b\d+(?:[.,]\d+)?\b/g) || []).length;
  const positionedWords = candidate.words.filter((word) => word.bbox).length;

  return (
    confidence * 2 +
    labelCount * 12 +
    Math.min(numericCount, 100) * 0.25 +
    Math.min(text.length, 2500) * 0.005 +
    Math.min(positionedWords, 100) * 0.05
  );
}

export async function extractTextFromImage(filePath) {
  await fs.access(filePath);

  const variants = await createImageVariants(filePath);
  const worker = await createWorker("eng");
  const candidates = [];

  const pageModes = [
    { name: "block", value: "6" },
    { name: "column", value: "4" },
    { name: "sparse", value: "11" },
  ];

  try {
    for (const variant of variants) {
      for (const mode of pageModes) {
        try {
          await worker.setParameters({
            tessedit_pageseg_mode: mode.value,
            preserve_interword_spaces: "1",
          });

          const result = await worker.recognize(
            variant.buffer,
            {},
            {
              text: true,
              blocks: true,
              tsv: true,
            }
          );

          const data = result?.data ?? {};
          const text = String(data.text ?? "").trim();

          if (!text) continue;

          const blockDetails = collectBlockDetails(data.blocks ?? []);

          const sourceWords =
            Array.isArray(data.words) && data.words.length
              ? data.words
              : blockDetails.words;

          const words = sourceWords
            .map(normalizeWord)
            .filter(Boolean);

          const lines =
            Array.isArray(data.lines) && data.lines.length
              ? data.lines
                  .map((line) =>
                    typeof line === "string"
                      ? line.trim()
                      : String(line?.text ?? "").trim()
                  )
                  .filter(Boolean)
              : blockDetails.lines;

          const candidate = {
            variant: variant.name,
            mode: mode.name,
            confidence: Number(data.confidence) || 0,
            text,
            words,
            lines,
            score: 0,
          };

          candidate.score = scoreCandidate(candidate);
          candidates.push(candidate);

          console.log(
            `OCR ${variant.name}/${mode.name}` +
            ` confidence=${candidate.confidence}` +
            ` words=${words.length}` +
            ` positioned=${words.filter((word) => word.bbox).length}` +
            ` score=${candidate.score.toFixed(2)}`
          );
        } catch (error) {
          console.error(
            `OCR pass failed (${variant.name}/${mode.name}):`,
            error.message
          );
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  if (candidates.length === 0) {
    throw new Error("OCR could not extract text from this image.");
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  console.log("Selected OCR variant:", best.variant);
  console.log("Selected OCR mode:", best.mode);
  console.log("Selected OCR confidence:", best.confidence);
  console.log("Selected OCR word count:", best.words.length);
  console.log(
    "Words with coordinates:",
    best.words.filter((word) => word.bbox).length
  );

  return {
    text: best.text,
    confidence: best.confidence,
    words: best.words,
    lines: best.lines,
    selectedVariant: best.variant,
    selectedMode: best.mode,
    attempts: candidates.map((candidate) => ({
      variant: candidate.variant,
      mode: candidate.mode,
      confidence: candidate.confidence,
      score: Number(candidate.score.toFixed(2)),
      characters: candidate.text.length,
      wordCount: candidate.words.length,
      positionedWordCount: candidate.words.filter((word) => word.bbox).length,
      lineCount: candidate.lines.length,
    })),
  };
}
