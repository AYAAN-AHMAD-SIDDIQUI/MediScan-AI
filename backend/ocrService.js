const { createWorker } = require("tesseract.js");

const extractTextFromImage = async (imagePath) => {
    const worker = await createWorker("eng");

    try {
        const { data } = await worker.recognize(imagePath);

        return data.text;
    } finally {
        await worker.terminate();
    }
};

module.exports = {
    extractTextFromImage
};