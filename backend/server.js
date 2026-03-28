require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* ---------------- Resume Upload + Question Generation ---------------- */

app.post("/upload-resume", upload.single("resume"), async (req, res) => {

  try {

    const topic = req.body.topic || "general software engineering";
    const difficulty = req.body.difficulty || "intermediate";

    console.log("Generating interview questions...");

    const filePath = req.file.path;
    const dataBuffer = fs.readFileSync(filePath);

    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    const prompt = `
You are a senior technical interviewer.

Generate 10 interview questions.

Topic: ${topic}
Difficulty Level: ${difficulty}

Structure:

Technical Questions:
5 questions

Project Questions:
3 questions

Behavioral Questions:
2 questions

Resume:
${resumeText}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const questions = response.data.choices[0].message.content;

    res.json({
      interviewQuestions: questions,
      resumeText: resumeText
    });

  } catch (error) {

    console.error("Resume processing failed:", error.message);
    res.status(500).send("Resume processing failed");

  }

});


/* ---------------- Resume ATS Analyzer ---------------- */

app.post("/analyze-resume", async (req, res) => {

  try {

    const resume = req.body.resume;

    const prompt = `
You are an ATS resume analyzer.

Analyze the resume and provide:

ATS Score out of 100
Strengths
Weaknesses
Suggestions to improve ATS score

Resume:
${resume}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const analysis = response.data.choices[0].message.content;

    res.json({ analysis });

  } catch (error) {

    console.error("Resume analysis failed:", error.message);
    res.status(500).send("Resume analysis failed");

  }

});


/* ---------------- Answer Evaluation + Follow-up ---------------- */

app.post("/evaluate-answer", async (req, res) => {

  try {

    const userAnswer = req.body.answer;

    const prompt = `
You are a technical interviewer.

Evaluate the candidate answer.

Provide:

Score out of 10
Strengths
Improvements
One Follow-up Question based on the answer

Answer:
${userAnswer}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const feedback = response.data.choices[0].message.content;

    res.json({ feedback });

  } catch (error) {

    console.error("Evaluation failed:", error.message);
    res.status(500).send("Answer evaluation failed");

  }

});


/* ---------------- Server ---------------- */

app.listen(8080, () => {

  console.log("Server running on port 8080");

});