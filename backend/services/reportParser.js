
const TESTS = [
  { name: "Hemoglobin", aliases: ["hemoglobin", "haemoglobin"], unit: "g/dL", min: 0, max: 30 },
  { name: "Hematocrit", aliases: ["hematocrit", "packed cell volume", "pcv", "hct"], unit: "%", min: 0, max: 100 },
  { name: "RBC Count", aliases: ["rbc count", "red blood cell count", "erythrocyte count"], unit: "mil/mm3", min: 0, max: 30 },
  { name: "MCV", aliases: ["mean corpuscular volume", "mcv"], unit: "fL", min: 0, max: 300 },
  { name: "MCH", aliases: ["mean corpuscular hemoglobin", "mch"], unit: "pg", min: 0, max: 100 },
  { name: "MCHC", aliases: ["mean corpuscular hemoglobin concentration", "mchc"], unit: "g/dL", min: 0, max: 100 },
  { name: "RDW-CV", aliases: ["red cell distribution width", "rdw-cv", "rdw cv", "rdw"], unit: "%", min: 0, max: 100 },
  { name: "WBC Count", aliases: ["total leukocyte count", "total leucocyte count", "tlc", "wbc count", "white blood cell count"], unit: "thou/mm3", min: 0, max: 500 },
  { name: "Neutrophils", aliases: ["segmented neutrophils", "neutrophils"], unit: "%", min: 0, max: 100 },
  { name: "Lymphocytes", aliases: ["lymphocytes"], unit: "%", min: 0, max: 100 },
  { name: "Monocytes", aliases: ["monocytes"], unit: "%", min: 0, max: 100 },
  { name: "Eosinophils", aliases: ["eosinophils"], unit: "%", min: 0, max: 100 },
  { name: "Basophils", aliases: ["basophils"], unit: "%", min: 0, max: 100 },
  { name: "Platelets", aliases: ["platelet count", "platelets", "thrombocyte count"], unit: "thou/mm3", min: 0, max: 10000 },
  { name: "Bands", aliases: ["band cells", "bands"], unit: "%", min: 0, max: 100 },
];

const PLAUSIBLE_RANGES = {
  "Hemoglobin": [3, 25],
  "Hematocrit": [5, 80],
  "RBC Count": [0.1, 15],
  "MCV": [10, 200],
  "MCH": [1, 80],
  "MCHC": [5, 60],
  "RDW-CV": [1, 40],
  "WBC Count": [0.1, 100],
  "Neutrophils": [0, 100],
  "Lymphocytes": [0, 100],
  "Monocytes": [0, 100],
  "Eosinophils": [0, 100],
  "Basophils": [0, 100],
  "Platelets": [1, 5000],
  "Bands": [0, 100],
};

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9.%+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWords(ocrResult) {
  return (Array.isArray(ocrResult?.words) ? ocrResult.words : [])
    .map((word, index) => {
      const box = word?.bbox ?? word?.boundingBox;
      if (!box) return null;

      const x0 = Number(box.x0 ?? box.left);
      const y0 = Number(box.y0 ?? box.top);
      const x1 = Number(box.x1 ?? box.right);
      const y1 = Number(box.y1 ?? box.bottom);
      const text = String(word.text ?? "").trim();

      if (!text || ![x0, y0, x1, y1].every(Number.isFinite)) {
        return null;
      }

      return {
        index,
        text,
        normalized: normalizeText(text),
        x0, y0, x1, y1,
        cx: (x0 + x1) / 2,
        cy: (y0 + y1) / 2,
        height: Math.max(1, y1 - y0),
      };
    })
    .filter(Boolean);
}

function groupWordsIntoLines(words) {
  const sorted = [...words].sort((a, b) => a.cy - b.cy || a.x0 - b.x0);
  const lines = [];

  for (const word of sorted) {
    let target = null;
    let bestDistance = Infinity;

    for (const line of lines) {
      const distance = Math.abs(word.cy - line.cy);
      const tolerance = Math.max(word.height, line.avgHeight) * 0.65;

      if (distance <= tolerance && distance < bestDistance) {
        target = line;
        bestDistance = distance;
      }
    }

    if (!target) {
      lines.push({
        words: [word],
        cy: word.cy,
        avgHeight: word.height,
      });
    } else {
      target.words.push(word);
      target.cy = target.words.reduce((sum, item) => sum + item.cy, 0) / target.words.length;
      target.avgHeight = target.words.reduce((sum, item) => sum + item.height, 0) / target.words.length;
    }
  }

  for (const line of lines) {
    line.words.sort((a, b) => a.x0 - b.x0);
    line.text = line.words.map((word) => word.text).join(" ");
    line.x0 = Math.min(...line.words.map((word) => word.x0));
    line.x1 = Math.max(...line.words.map((word) => word.x1));
  }

  return lines.sort((a, b) => a.cy - b.cy);
}

function findLabel(line, test) {
  const text = ` ${normalizeText(line.text)} `;

  for (const alias of [...test.aliases].sort((a, b) => b.length - a.length)) {
    if (text.includes(` ${normalizeText(alias)} `)) return alias;
  }

  return null;
}

function findRows(lines) {
  const rows = [];

  for (const line of lines) {
    for (const test of TESTS) {
      const alias = findLabel(line, test);
      if (alias) {
        rows.push({ test, alias, line });
        break;
      }
    }
  }

  return rows;
}

function parseNumericWord(word) {
  // Accept only clean numeric tokens. Never silently convert O to zero.
  const token = word.text.trim().replace(/^[^\d.]+|[^\d.]+$/g, "");
  if (!/^\d+(?:[.,]\d+)?$/.test(token)) return null;

  const value = Number(token.replace(",", "."));
  return Number.isFinite(value) ? { ...word, value } : null;
}

function numericWords(words) {
  return words.map(parseNumericWord).filter(Boolean);
}

function findRangeOnLine(line, test) {
  const tokens = numericWords(line.words).sort((a, b) => a.x0 - b.x0);
  const plausible = PLAUSIBLE_RANGES[test.name];
  if (!plausible) return null;

  const found = [];

  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];

    if (a.value >= b.value) continue;
    if (a.value < plausible[0] || b.value > plausible[1]) continue;

    // A range pair must be visually separated like two columns,
    // not simply two nearby result numbers.
    const gap = b.x0 - a.x1;
    if (gap < 0) continue;

    found.push({ min: a.value, max: b.value, gap });
  }

  // If several pairs could be a range, refuse to guess.
  if (found.length !== 1) return null;
  return { min: found[0].min, max: found[0].max };
}

function findReferenceRange(lines, row) {
  const plausible = PLAUSIBLE_RANGES[row.test.name];
  if (!plausible) return null;

  const candidates = [];

  for (const line of lines) {
    if (Math.abs(line.cy - row.line.cy) > Math.max(row.line.avgHeight * 3, 60)) {
      continue;
    }

    const range = findRangeOnLine(line, row.test);
    if (range) {
      candidates.push({
        range,
        distance: Math.abs(line.cy - row.line.cy),
      });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);

  if (!candidates.length) return null;

  // Multiple nearby ranges are ambiguous.
  if (
    candidates.length > 1 &&
    Math.abs(candidates[0].distance - candidates[1].distance) < 1
  ) {
    return null;
  }

  return candidates[0].range;
}

function nextLabelY(rows, row) {
  const next = rows
    .filter((item) => item.line.cy > row.line.cy + 2)
    .sort((a, b) => a.line.cy - b.line.cy)[0];

  return next ? next.line.cy : Infinity;
}

function extractValue(lines, rows, row, range) {
  const labelLine = row.line;
  const maxY = nextLabelY(rows, row);
  const test = row.test;

  // First: numeric values on the same line, to the right of the label.
  let candidates = numericWords(labelLine.words).filter((token) => {
    return token.x0 > labelLine.x0 &&
      token.value >= test.min &&
      token.value <= test.max;
  });

  if (range) {
    candidates = candidates.filter(
      (token) => token.value !== range.min && token.value !== range.max
    );
  }

  if (candidates.length === 1) return candidates[0].value;
  if (candidates.length > 1) return null;

  // Second: value may appear on the next visual line below its label.
  // Only consider a short vertical window and the left result column.
  const nearbyLines = lines.filter((line) =>
    line.cy > labelLine.cy &&
    line.cy < maxY &&
    line.cy - labelLine.cy <= Math.max(labelLine.avgHeight * 3, 65)
  );

  const below = [];

  for (const line of nearbyLines) {
    for (const token of numericWords(line.words)) {
      if (token.value < test.min || token.value > test.max) continue;

      // Exclude numbers far to the right, where reference ranges often sit.
      if (token.cx > labelLine.x0 + 650) continue;

      if (range && (token.value === range.min || token.value === range.max)) {
        continue;
      }

      below.push(token);
    }
  }

  const unique = [...new Map(
    below.map((token) => [`${token.value}:${Math.round(token.cy)}`, token])
  ).values()];

  return unique.length === 1 ? unique[0].value : null;
}

function getStatus(value, range) {
  if (value === null || !range) return "NEEDS_REVIEW";
  return value < range.min || value > range.max
    ? "OUTSIDE_RANGE"
    : "NORMAL";
}

export function parseReport(ocrResult) {
  const text = typeof ocrResult === "string"
    ? ocrResult
    : String(ocrResult?.text ?? "");

  const confidence = typeof ocrResult === "object" && ocrResult
    ? Number(ocrResult.confidence ?? 0)
    : 0;

  const isCBC = /\b(cbc|complete blood count|complete blood picture|hemogram|hematology)\b/i.test(text);

  if (!text.trim() || !isCBC) {
    return {
      reportType: "UNKNOWN",
      overallStatus: "NEEDS_REVIEW",
      ocrConfidence: confidence,
      parameters: [],
      simpleExplanation: "The report type or readable test results could not be verified.",
      disclaimer: "This automated extraction is not a diagnosis. Verify results against the original report with a qualified clinician.",
    };
  }

  const words = normalizeWords(typeof ocrResult === "object" ? ocrResult : null);

  if (!words.length) {
    return {
      reportType: "CBC",
      overallStatus: "NEEDS_REVIEW",
      ocrConfidence: confidence,
      parameters: [],
      simpleExplanation: "Word coordinates are unavailable, so test values could not be matched safely.",
      disclaimer: "This automated extraction is not a diagnosis. Verify results against the original report with a qualified clinician.",
    };
  }

  const lines = groupWordsIntoLines(words);
  const rows = findRows(lines);
  const seen = new Set();
  const parameters = [];

  for (const row of rows) {
    if (seen.has(row.test.name)) continue;
    seen.add(row.test.name);

    const referenceRange = findReferenceRange(lines, row);
    const value = extractValue(lines, rows, row, referenceRange);

    parameters.push({
      test: row.test.name,
      value,
      unit: row.test.unit,
      referenceRange,
      status: getStatus(value, referenceRange),
      sourceLine: row.line.text,
    });
  }

  const needsReview = parameters.length === 0 ||
    confidence < 70 ||
    parameters.some((item) => item.status === "NEEDS_REVIEW");

  const outsideRange = parameters.some(
    (item) => item.status === "OUTSIDE_RANGE"
  );

  const overallStatus = needsReview
    ? "NEEDS_REVIEW"
    : outsideRange
      ? "OUTSIDE_RANGE"
      : "NORMAL";

  return {
    reportType: "CBC",
    overallStatus,
    ocrConfidence: confidence,
    parameters,
    simpleExplanation: overallStatus === "NEEDS_REVIEW"
      ? "Some values or reference ranges could not be verified reliably. Compare them with the original report."
      : overallStatus === "OUTSIDE_RANGE"
        ? "One or more extracted values fall outside the detected reference ranges. This is not a diagnosis; review the original report with a qualified clinician."
        : "The extracted values fall within detected reference ranges. This does not confirm that the report is medically normal.",
    disclaimer: "This automated extraction is not a diagnosis. Laboratory reference ranges vary by laboratory and patient factors. A qualified clinician should review the original report.",
  };
}
