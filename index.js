import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();
const port = 3000;

// PostgreSQL Connection Setup
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL, 
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Function to Fetch Questions from Database
async function fetchQuestions() {
  try {
    const result = await pool.query("SELECT * FROM capitals");
    return result.rows;
  } catch (err) {
    console.error("Error fetching questions:", err);
    return [];
  }
}

let quiz = [];
let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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
