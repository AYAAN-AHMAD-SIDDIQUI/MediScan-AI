import prisma from "../config/prisma.js";
import { analyzeXray } from "../services/xrayService.js";
import { localizeXray } from "../services/xrayLocalizer.js";
import path from "path";
import fs from "fs";

export const uploadXray = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "X-ray image is required",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const xray = await prisma.xrayScan.create({
      data: {
        patientId: patient.id,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "X-ray uploaded successfully",
      xray,
    });
  } catch (error) {
    console.error("Upload X-ray error:", error);

    return res.status(500).json({
      message: "Failed to upload X-ray",
      error: error.message,
    });
  }
};


export const analyzeUploadedXray = async (req, res) => {
  try {
    const xrayId = Number(req.params.id);

    if (!xrayId) {
      return res.status(400).json({
        message: "Invalid X-ray ID",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: req.user.userId,
      },
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const xray = await prisma.xrayScan.findFirst({
      where: {
        id: xrayId,
        patientId: patient.id,
      },
    });

    if (!xray) {
      return res.status(404).json({
        message: "X-ray not found",
      });
    }


    // ---------------------------------------
    // 1. CHECK EXISTING ANALYSIS
    // ---------------------------------------

    const existingAnalysis = await prisma.xrayAnalysis.findUnique({
      where: {
        xrayId: xray.id,
      },
    });

    if (existingAnalysis) {
      console.log("Returning saved X-ray analysis");

      return res.status(200).json({
        message: "Saved X-ray analysis returned",
        xray,
        analysis: existingAnalysis,
        cached: true,
      });
    }


    // ---------------------------------------
    // 2. RUN FRACATLAS LOCALIZATION
    // ---------------------------------------

    console.log("Running FracAtlas localization...");

    const uploadAbsolutePath = path.resolve(xray.fileUrl);

    const highlightDirectory = path.join(
      process.cwd(),
      "uploads",
      "xray-highlights"
    );

    if (!fs.existsSync(highlightDirectory)) {
      fs.mkdirSync(highlightDirectory, {
        recursive: true,
      });
    }

    const highlightedFileName =
      `xray-${xray.id}-${Date.now()}-highlighted.jpg`;

    const highlightedAbsolutePath = path.join(
      highlightDirectory,
      highlightedFileName
    );


    const localization = await localizeXray(
      uploadAbsolutePath,
      highlightedAbsolutePath
    );

    console.log(
      "FracAtlas detections:",
      localization.detectionCount
    );


    // ---------------------------------------
    // 3. CREATE PUBLIC IMAGE URL
    // ---------------------------------------

    let highlightedImageUrl = null;

    if (
      localization.success &&
      localization.highlightedImage
    ) {
      highlightedImageUrl =
        `/uploads/xray-highlights/${highlightedFileName}`;
    }


    // ---------------------------------------
    // 4. RUN GEMINI EXPLANATION
    // ---------------------------------------

    console.log("Calling Gemini for X-ray explanation...");

    const geminiResult = await analyzeXray({
      imagePath: uploadAbsolutePath,
      bodyPart: xray.bodyPart,
    });


    // ---------------------------------------
    // 5. COMBINE LOCALIZATION + GEMINI
    // ---------------------------------------

    const result = {
      bodyPart:
        geminiResult.bodyPart || null,

      imageQuality:
        geminiResult.imageQuality || null,

      observations:
        geminiResult.observations || [],

      areasForReview:
        geminiResult.areasForReview || [],

      simpleExplanation:
        geminiResult.simpleExplanation || null,

      confidence:
        geminiResult.confidence || null,

      status:
        localization.detectionCount > 0
          ? "NEEDS_REVIEW"
          : "NO_LOCALIZED_REGION",

      recommendation:
        geminiResult.recommendation || null,

      localization: {
        model:
          localization.model,

        detectionCount:
          localization.detectionCount,

        detections:
          localization.detections,

        highlightedImageUrl,
      },

      disclaimer:
        "The highlighted region is an AI-detected area requiring professional review. It is not a confirmed medical diagnosis.",
    };


    // ---------------------------------------
    // 6. SAVE ANALYSIS
    // ---------------------------------------

    const savedAnalysis =
      await prisma.xrayAnalysis.create({
        data: {
          xrayId: xray.id,
          result,
        },
      });


    // ---------------------------------------
    // 7. UPDATE XRAY STATUS
    // ---------------------------------------

    const updatedXray =
      await prisma.xrayScan.update({
        where: {
          id: xray.id,
        },
        data: {
          bodyPart:
            geminiResult.bodyPart || null,

          status:
            localization.detectionCount > 0
              ? "NEEDS_REVIEW"
              : "NO_LOCALIZED_REGION",
        },
      });


    // ---------------------------------------
    // 8. RETURN EVERYTHING TO FRONTEND
    // ---------------------------------------

    return res.status(200).json({
      message:
        "X-ray analyzed successfully",

      xray: updatedXray,

      analysis: savedAnalysis,

      localization,

      highlightedImageUrl,

      cached: false,
    });

  } catch (error) {

    console.error(
      "Analyze X-ray error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to analyze X-ray",

      error:
        error.message,
    });
  }
};


export const getAllXrays = async (req, res) => {
  try {

    const patient =
      await prisma.patient.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const xrays =
      await prisma.xrayScan.findMany({
        where: {
          patientId: patient.id,
        },

        include: {
          analysis: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      message:
        "X-rays fetched successfully",

      xrays,
    });

  } catch (error) {

    console.error(
      "Get X-rays error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch X-rays",

      error:
        error.message,
    });
  }
};


export const getXrayById = async (req, res) => {
  try {

    const xrayId =
      Number(req.params.id);

    const patient =
      await prisma.patient.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

    if (!patient) {
      return res.status(404).json({
        message:
          "Patient profile not found",
      });
    }

    const xray =
      await prisma.xrayScan.findFirst({
        where: {
          id: xrayId,
          patientId: patient.id,
        },

        include: {
          analysis: true,
        },
      });

    if (!xray) {
      return res.status(404).json({
        message:
          "X-ray not found",
      });
    }

    return res.status(200).json({
      message:
        "X-ray fetched successfully",

      xray,
    });

  } catch (error) {

    console.error(
      "Get X-ray error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch X-ray",

      error:
        error.message,
    });
  }
};