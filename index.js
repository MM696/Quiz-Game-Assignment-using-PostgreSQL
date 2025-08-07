import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config(); // Load .env file

const app = express();
const port = 3000;

// Supabase Client Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Function to Fetch Questions from Supabase
async function fetchQuestions() {
  try {
    const { data, error } = await supabase.from("capitals").select("*");

    if (error) {
      console.error("Error fetching questions:", error.message);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return [];
  }
}

let quiz = [];
let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Set View Engine
app.set("view engine", "ejs");

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  quiz = await fetchQuestions();
  await nextQuestion();

  res.render("index.ejs", { question: currentQuestion });
});

// POST - Handle answer submission
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = currentQuestion.capital === answer;

  if (isCorrect) totalCorrect++;

  await nextQuestion();

  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Function to get next question
async function nextQuestion() {
  if (quiz.length > 0) {
    currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
  } else {
    currentQuestion = { country: "No data", capital: "No data" };
  }
}

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
