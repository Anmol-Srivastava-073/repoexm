const fetch = require("node-fetch");
const Busboy = require("busboy");

const MODEL = "Salesforce/blip-image-captioning-base";
// Replace with your Hugging Face token
const HF_TOKEN = "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";

exports.handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers });
    let uploadBuffer = null;

    busboy.on("file", (fieldname, file) => {
      const chunks = [];
      file.on("data", (data) => chunks.push(data));
      file.on("end", () => {
        uploadBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", async () => {
      try {
        if (!uploadBuffer) {
          return resolve({
            statusCode: 400,
            body: JSON.stringify({ error: "No file uploaded" }),
          });
        }

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${MODEL}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HF_TOKEN}`,
              "Content-Type": "application/octet-stream",
            },
            body: uploadBuffer,
          }
        );

        const result = await response.json();

        if (result.error) {
          return resolve({
            statusCode: 500,
            body: JSON.stringify({ error: result.error }),
          });
        }

        const caption = result[0]?.generated_text || "No caption found.";
        return resolve({
          statusCode: 200,
          body: JSON.stringify({ caption }),
        });
      } catch (err) {
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ error: err.message }),
        });
      }
    });

    busboy.end(Buffer.from(event.body, "base64"));
  });
};
