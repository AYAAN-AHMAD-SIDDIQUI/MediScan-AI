import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const PYTHON_PATH =
  "D:\\mediscan-xray-model\\venv\\Scripts\\python.exe";

const SCRIPT_PATH =
  "D:\\mediscan-xray-model\\xray_segment.py";

export const localizeXray = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const python = spawn(
      PYTHON_PATH,
      [
        SCRIPT_PATH,
        inputPath,
        outputPath,
      ],
      {
        windowsHide: true,
      }
    );

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("error", (error) => {
      reject(error);
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `X-ray localization failed.\n${stderr || stdout}`
          )
        );
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (error) {
        reject(
          new Error(
            `Invalid localization response.\n${stdout}`
          )
        );
      }
    });
  });
};