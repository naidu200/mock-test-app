const express = require("express");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err.message));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const questionSchema = new mongoose.Schema({
  question: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  answer: String
});

const resultSchema = new mongoose.Schema({
  username: String,
  score: Number,
  total_questions: Number,
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
const Question = mongoose.model("Question", questionSchema);
const Result = mongoose.model("Result", resultSchema);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  dest: "uploads/"
});

// PAGE ROUTES

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get(["/register", "/register.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "test.html"));
});

app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "result.html"));
});

app.get(["/admin", "/admin.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// REGISTER API

app.post("/register", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    username = username ? username.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    password = password ? password.trim() : "";

    if (!username || !email || !password) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    await User.create({
      username,
      email,
      password
    });

    res.json({
      success: true,
      message: "Registration Successful"
    });

  } catch (err) {
    console.log("Register Error:", err);

    res.json({
      success: false,
      message: "Registration Failed"
    });
  }
});

// LOGIN API

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email ? email.trim().toLowerCase() : "";
    password = password ? password.trim() : "";

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email not found"
      });
    }

    if (user.password !== password) {
      return res.json({
        success: false,
        message: "Wrong password"
      });
    }

    res.json({
      success: true,
      username: user.username
    });

  } catch (err) {
    console.log("Login Error:", err);

    res.json({
      success: false,
      message: "Login Failed"
    });
  }
});

// ADD QUESTION API

app.post("/add-question", async (req, res) => {
  try {
    const {
      question,
      option1,
      option2,
      option3,
      option4,
      answer
    } = req.body;

    if (!question || !option1 || !option2 || !option3 || !option4 || !answer) {
      return res.json({
        message: "All question fields are required"
      });
    }

    await Question.create({
      question: question.trim(),
      option1: option1.trim(),
      option2: option2.trim(),
      option3: option3.trim(),
      option4: option4.trim(),
      answer: answer.trim()
    });

    res.json({
      message: "Question Added Successfully"
    });

  } catch (err) {
    console.log("Question Add Error:", err);

    res.json({
      message: "Question Add Failed"
    });
  }
});

// CSV UPLOAD API

app.post("/upload-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        message: "No file uploaded"
      });
    }

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        if (
          row.question &&
          row.option1 &&
          row.option2 &&
          row.option3 &&
          row.option4 &&
          row.answer
        ) {
          rows.push({
            question: row.question.trim(),
            option1: row.option1.trim(),
            option2: row.option2.trim(),
            option3: row.option3.trim(),
            option4: row.option4.trim(),
            answer: row.answer.trim()
          });
        }
      })
      .on("end", async () => {
        try {
          if (rows.length > 0) {
            await Question.insertMany(rows);
          }

          fs.unlinkSync(req.file.path);

          res.json({
            message: `${rows.length} Questions Uploaded Successfully`
          });

        } catch (err) {
          console.log("CSV Insert Error:", err);

          res.json({
            message: "CSV Upload Failed"
          });
        }
      });

  } catch (err) {
    console.log("CSV Upload Error:", err);

    res.json({
      message: "CSV Upload Failed"
    });
  }
});

// RANDOM QUESTIONS API

app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.aggregate([
      {
        $sample: {
          size: 50
        }
      }
    ]);

    res.json(questions);

  } catch (err) {
    console.log("Question Fetch Error:", err);
    res.json([]);
  }
});

// SAVE RESULT API

app.post("/save-result", async (req, res) => {
  try {
    const {
      username,
      score,
      total_questions
    } = req.body;

    await Result.create({
      username: username || "Student",
      score: Number(score),
      total_questions: Number(total_questions)
    });

    res.json({
      message: "Result Saved"
    });

  } catch (err) {
    console.log("Result Save Error:", err);

    res.json({
      message: "Result Save Failed"
    });
  }
});

// LEADERBOARD API

app.get("/leaderboard", async (req, res) => {
  try {
    const results = await Result.find()
      .sort({ score: -1 })
      .limit(10);

    res.json(results);

  } catch (err) {
    console.log("Leaderboard Error:", err);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});