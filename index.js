import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Connection Setup 
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set in environment variables.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Test database connection
pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

//Fetch Questions
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

//Routes
app.get("/", async (req, res) => {
  totalCorrect = 0;
  quiz = await fetchQuestions();
  await nextQuestion();

  res.render("index.ejs", { question: currentQuestion });
});

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

//Next Question
async function nextQuestion() {
  if (quiz.length > 0) {
    currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
  } else {
    currentQuestion = { country: "No data", capital: "No data" };
  }
}

//Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
