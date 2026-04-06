import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import Groq from "groq-sdk";

dotenv.config();
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not defined in the .env file");
}

// ---------- AI SETUP (GROQ) ----------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ensure uploads folders exist
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("uploads/documents")) fs.mkdirSync("uploads/documents");

// ---------------- APP + SOCKET SETUP ----------------
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors({ origin: "*" }));
app.use(express.json());

// ---------- Multer Setup ----------
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const docStorage = multer.diskStorage({
  destination: "uploads/documents/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-doc" + path.extname(file.originalname));
  },
});
const docUpload = multer({ storage: docStorage });

app.use("/uploads", express.static("uploads"));

// ---------------- SOCKET.IO EVENTS ----------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (role) => {
    socket.data.role = role;
    socket.data.mode = "ai";
    console.log(`${role} registered: ${socket.id}`);
  });

  socket.on("sendMessage", async (msg) => {
    if (!msg) return;

    console.log(`${socket.data.role} says:`, msg);

    // Switch to expert mode
    if (msg.toLowerCase().includes("expert")) {
      socket.data.mode = "expert";
      socket.emit("receiveMessage", {
        sender: "System",
        text: "✅ You are now connected to a human expert!",
      });
      return;
    }

    // Forward farmer message to all experts
    if (socket.data.mode === "expert") {
      for (const s of io.sockets.sockets.values()) {
        if (s.data.role === "expert") {
          s.emit("expertMessage", { farmerId: socket.id, text: msg });
        }
      }
    } else {
      // Ask AI
      const prompt = msg + ". Give the reply in HTML format only.";
      const aiReply = await getAIReply({ prompt });

      socket.emit("receiveMessage", { sender: "AI", text: aiReply });
    }
  });

  socket.on("expertReply", ({ farmerId, text }) => {
    if (!text) return;
    io.to(farmerId).emit("receiveMessage", { sender: "Expert", text });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ---------- PYTHON ML MODEL CALL ----------
async function getPredictionFromPython(imagePath) {
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const res = await fetch("http://localhost:8000/predict", {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.prediction;
}

// ---------------- UPLOAD ROUTE ----------------
app.post("/upload", upload.single("image"), async (req, res) => {
  const { farmerId } = req.body;
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });

  const imagePath = req.file.path;
  const imageUrl = `http://localhost:5000/${imagePath.replace(/\\/g, "/")}`;

  const farmerSocket = io.sockets.sockets.get(farmerId);
  if (!farmerSocket)
    return res.status(400).json({ error: "Farmer socket not found." });

  // If farmer is in expert mode → forward to experts
  if (farmerSocket.data.mode === "expert") {
    for (const s of io.sockets.sockets.values()) {
      if (s.data.role === "expert") {
        s.emit("expertImage", { farmerId: farmerSocket.id, imageUrl });
      }
    }

    return res.json({
      reply: "📤 Image sent to expert for analysis.",
      imageUrl,
    });
  }

  // Else → process through Python + Gemini AI
  try {
    const prediction = await getPredictionFromPython(imagePath);

    const prompt = `
      A farmer uploaded an image of a crop.
      The ML model predicts it as **${prediction}**.
      Provide detailed advice including:
      - disease description
      - symptoms
      - causes
      - solutions/treatment
      Reply ONLY in HTML format.
    `;

    const aiReply = await getAIReply({ prompt });

    return res.json({
      reply: aiReply,
      prediction,
      imageUrl,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: "Failed to get prediction or AI advice.",
    });
  }
});

// ---------------- EXPERT AUTH ROUTES ----------------
const EXPERTS_FILE = "experts.json";

app.post("/api/expert/signup", docUpload.single("document"), (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password || !req.file) {
    return res.status(400).json({ error: "All fields including document are required." });
  }

  let experts = [];
  try {
    if (fs.existsSync(EXPERTS_FILE)) {
      experts = JSON.parse(fs.readFileSync(EXPERTS_FILE));
    }
  } catch (err) {
    console.error("Error reading experts file:", err);
  }

  if (experts.some(e => e.email === email)) {
    return res.status(400).json({ error: "Expert with this email already exists." });
  }

  const newExpert = {
    id: Date.now().toString(),
    fullName,
    email,
    password, // Storing as plaintext for local demo purposes
    documentPath: req.file.path,
    status: "active" // Could be 'pending' for manual verification
  };

  experts.push(newExpert);
  fs.writeFileSync(EXPERTS_FILE, JSON.stringify(experts, null, 2));

  res.json({ message: "Signup successful", expert: { id: newExpert.id, fullName, email } });
});

app.post("/api/expert/login", (req, res) => {
  const { email, password } = req.body;

  let experts = [];
  try {
    if (fs.existsSync(EXPERTS_FILE)) {
      experts = JSON.parse(fs.readFileSync(EXPERTS_FILE));
    }
  } catch (err) {
    console.error("Error reading experts file:", err);
  }

  const expert = experts.find(e => e.email === email && e.password === password);
  if (!expert) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({ message: "Login successful", expert: { id: expert.id, fullName: expert.fullName, email: expert.email } });
});

// ---------- AI MESSAGE HELPER FUNCTION (GROQ) ----------
async function getAIReply({ prompt, imagePath, mimeType }) {
  try {
    const messages = [{ role: "user", content: prompt }];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
    });

    return chatCompletion.choices[0]?.message?.content || "No response from AI.";
  } catch (error) {
    console.error("AI API error:", error);
    return "⚠️ Error contacting AI service.";
  }
}

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
