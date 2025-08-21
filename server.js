const express = require("express");
const fetch = require("node-fetch");
const Busboy = require("busboy");

const app = express();
const PORT = 8080;

// Hugging Face Model
const MODEL = "Salesforce/blip-image-captioning-base";

// ⚠️ Replace with your Hugging Face API token
const HF_TOKEN = "hf_xxxxxYOURTOKENxxxxx";

app.post("/getCaption", (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const busboy = new Busboy({ headers: req.headers });
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
        return res.status(400).json({ error: "No file uploaded" });
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
        return res.status(500).json({ error: result.error });
      }

      const caption = result[0]?.generated_text || "No caption found.";
      return res.json({ caption });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });

  req.pipe(busboy);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
