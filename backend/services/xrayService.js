import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const execFileAsync = promisify(execFile);

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// ======================================================
// FRACATLAS PYTHON MODEL CONFIG
// ======================================================

const PYTHON_PATH =
    process.env.XRAY_PYTHON_PATH ||
    "D:\\mediscan-xray-model\\venv\\Scripts\\python.exe";

const XRAY_SEGMENT_SCRIPT =
    process.env.XRAY_SEGMENT_SCRIPT ||
    "D:\\mediscan-xray-model\\xray_segment.py";

const HIGHLIGHT_DIR =
    "D:\\mediscan-ai\\backend\\uploads\\xrays\\highlighted";

// ======================================================
// RUN REAL FRACATLAS SEGMENTATION
// ======================================================

const runFractureLocalization = async (imagePath) => {
    await fs.mkdir(HIGHLIGHT_DIR, {
        recursive: true,
    });

    const fileName =
        `${path.parse(imagePath).name}_highlighted.jpg`;

    const outputPath =
        path.join(HIGHLIGHT_DIR, fileName);

    console.log("Running FracAtlas segmentation...");

    const { stdout, stderr } = await execFileAsync(
        PYTHON_PATH,
        [
            XRAY_SEGMENT_SCRIPT,
            imagePath,
            outputPath,
        ],
        {
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024,
        }
    );

    if (stderr) {
        console.log("FracAtlas stderr:", stderr);
    }

    console.log("FracAtlas output:", stdout);

    let result;

    try {
        result = JSON.parse(stdout.trim());
    } catch (error) {
        throw new Error(
            `Invalid FracAtlas response: ${stdout}`
        );
    }

    if (!result.success) {
        throw new Error(
            result.error || "FracAtlas segmentation failed"
        );
    }

    return {
        ...result,
        highlightedImagePath: outputPath,
    };
};

// ======================================================
// MAIN X-RAY ANALYSIS
// ======================================================

export const analyzeXray = async ({
    imagePath,
    bodyPart,
}) => {
    try {
        // ==================================================
        // CHECK API KEY
        // ==================================================

        if (!process.env.GEMINI_API_KEY) {
            throw new Error(
                "GEMINI_API_KEY is missing in .env"
            );
        }

        // ==================================================
        // CHECK IMAGE
        // ==================================================

        if (!imagePath) {
            throw new Error(
                "X-ray image path is missing"
            );
        }

        const normalizedPath =
            String(imagePath).replace(/\\/g, "/");

        const absolutePath =
            path.isAbsolute(normalizedPath)
                ? normalizedPath
                : path.join(
                    process.cwd(),
                    normalizedPath
                );

        console.log(
            "XRAY IMAGE PATH:",
            absolutePath
        );

        // ==================================================
        // STEP 1: REAL FRACTURE LOCALIZATION
        // ==================================================

        const localization =
            await runFractureLocalization(
                absolutePath
            );

        console.log(
            "FracAtlas detections:",
            localization.detectionCount
        );

        // ==================================================
        // STEP 2: READ ORIGINAL IMAGE
        // ==================================================

        const imageBuffer =
            await fs.readFile(absolutePath);

        const base64Image =
            imageBuffer.toString("base64");

        // ==================================================
        // MIME TYPE
        // ==================================================

        const extension =
            path.extname(absolutePath).toLowerCase();

        let mimeType = "image/png";

        if (
            extension === ".jpg" ||
            extension === ".jpeg"
        ) {
            mimeType = "image/jpeg";
        } else if (
            extension === ".webp"
        ) {
            mimeType = "image/webp";
        }

        // ==================================================
        // GEMINI EXPLANATION
        // ==================================================

        const prompt = `
You are an X-ray image-quality and documentation assistant.

Review the uploaded X-ray only for non-diagnostic
visual and technical observations.

Body part:
${bodyPart || "Unknown"}

IMPORTANT:

- Do NOT provide a medical diagnosis.
- Do NOT claim that a fracture is confirmed.
- Do NOT claim that an injury is confirmed.
- Do NOT provide treatment or medication advice.
- Do NOT invent patient information.
- Do NOT invent measurements.
- Do NOT invent localization coordinates.

A separate computer-vision model has already produced
a suspected region requiring professional review.

You must NOT create or modify the localization.

Focus on:

- image clarity
- contrast
- positioning
- visible anatomy
- image artifacts
- areas requiring professional review

Explain the technical observations in simple Hinglish.

The explanation must:

- use easy everyday Hinglish
- remain non-diagnostic
- clearly state that professional review is required
- never recommend medicine or treatment

Return ONLY valid JSON.

Use exactly:

{
  "bodyPart": "string",
  "imageQuality": "GOOD",
  "observations": [
    "short technical observation"
  ],
  "areasForReview": [
    "area requiring professional review"
  ],
  "simpleExplanation": "Simple Hinglish explanation.",
  "confidence": 0.0,
  "status": "NEEDS_REVIEW",
  "recommendation": "Professional review is recommended.",
  "disclaimer": "This is an AI-assisted prototype and does not provide a medical diagnosis."
}
`;

        console.log(
            "Sending original X-ray to Gemini..."
        );

        const response =
            await ai.models.generateContent({
                model: "gemini-3.6-flash",

                contents: [
                    {
                        text: prompt,
                    },
                    {
                        inlineData: {
                            mimeType,
                            data: base64Image,
                        },
                    },
                ],
            });

        let content = response.text;

        console.log(
            "GEMINI RAW RESPONSE:"
        );

        console.log(content);

        // ==================================================
        // DEFAULT GEMINI RESULT
        // ==================================================

        let result = {
            bodyPart:
                bodyPart || "Unknown",

            imageQuality: "FAIR",

            observations: [],

            areasForReview: [
                "The X-ray should be reviewed by a qualified radiologist or doctor.",
            ],

            simpleExplanation:
                "X-ray ki technical observations ko simple language me explain nahi kiya ja saka.",

            confidence: 0,

            status: "NEEDS_REVIEW",

            recommendation:
                "Professional review is recommended.",

            disclaimer:
                "This is an AI-assisted prototype and does not provide a medical diagnosis.",
        };

        // ==================================================
        // PARSE GEMINI RESPONSE
        // ==================================================

        if (
            content &&
            content.trim()
        ) {
            let cleanContent =
                String(content)
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

            const firstBrace =
                cleanContent.indexOf("{");

            const lastBrace =
                cleanContent.lastIndexOf("}");

            if (
                firstBrace !== -1 &&
                lastBrace !== -1
            ) {
                cleanContent =
                    cleanContent.substring(
                        firstBrace,
                        lastBrace + 1
                    );
            }

            try {
                const parsed =
                    JSON.parse(cleanContent);

                result = {
                    ...result,
                    ...parsed,
                };
            } catch (error) {
                console.error(
                    "GEMINI JSON PARSE ERROR:",
                    cleanContent
                );
            }
        }

        // ==================================================
        // NORMALIZE GEMINI RESULT
        // ==================================================

        result.bodyPart =
            result.bodyPart ||
            bodyPart ||
            "Unknown";

        result.imageQuality =
            ["GOOD", "FAIR", "POOR"].includes(
                result.imageQuality
            )
                ? result.imageQuality
                : "FAIR";

        result.observations =
            Array.isArray(
                result.observations
            )
                ? result.observations
                : [];

        result.areasForReview =
            Array.isArray(
                result.areasForReview
            )
                ? result.areasForReview
                : [
                    "The X-ray should be reviewed by a qualified radiologist or doctor.",
                ];

        result.simpleExplanation =
            result.simpleExplanation ||
            "Professional review recommended.";

        result.confidence =
            typeof result.confidence === "number"
                ? Math.max(
                    0,
                    Math.min(
                        1,
                        result.confidence
                    )
                )
                : 0;

        result.status =
            "NEEDS_REVIEW";

        result.recommendation =
            "Professional review is recommended.";

        result.disclaimer =
            "This is an AI-assisted prototype and does not provide a medical diagnosis.";

        // ==================================================
        // ADD REAL LOCALIZATION RESULT
        // ==================================================

        result.localization = {
            model:
                localization.model,

            detectionCount:
                localization.detectionCount,

            detections:
                localization.detections,

            imageWidth:
                localization.imageWidth,

            imageHeight:
                localization.imageHeight,

            highlightedImagePath:
                localization.highlightedImagePath,
        };

        // ==================================================
        // RETURN COMBINED RESULT
        // ==================================================

        return result;

    } catch (error) {

        console.error(
            "XRAY ANALYSIS ERROR:",
            error
        );

        throw error;
    }
};