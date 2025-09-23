// import express from "express";
// import { createServer } from "http";
// import cors from "cors";
// import { Server } from "socket.io";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import dotenv from "dotenv";
// import fetch from "node-fetch";
// import FormData from "form-data";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// // Load environment variables
// dotenv.config();
// if (!process.env.GOOGLE_API_KEY) {
//   throw new Error("GOOGLE_API_KEY is not defined in the .env file");
// }

// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// // Express + Socket.IO setup
// const app = express();
// const httpServer = createServer(app);
// const io = new Server(httpServer, { cors: { origin: "*" } });

// // Middleware
// app.use(cors({ origin: "*" }));
// app.use(express.json());

// // Multer config for uploads
// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });
// app.use("/uploads", express.static("uploads"));

// // --- Socket.IO Chat ---
// io.on("connection", (socket) => {
//   console.log("user connected:", socket.id);

//   // Register role
//   socket.on("register", (role) => {
//     socket.data.role = role;
//     socket.data.mode = "ai"; // default mode
//     console.log(`${role} registered: ${socket.id}`);
//   });

//   // Sending messages
//   socket.on("sendMessage", async (msg) => {
//     console.log(`${socket.data.role} says:`, msg);

//     if (msg.toLowerCase().includes("expert")) {
//       socket.data.mode = "expert";
//       socket.emit("receiveMessage", {
//         sender: "System",
//         text: "✅ You are now connected to a human expert!",
//       });
//       return;
//     }

//     if (socket.data.mode === "expert") {
//       socket.broadcast.emit("expertMessage", {
//         farmerId: socket.id,
//         text: msg,
//       });
//     } else {
//       const aiReply = await getAIReply({ prompt: msg });
//       socket.emit("receiveMessage", { sender: "AI", text: aiReply });
//     }
//   });

//   // Expert replying to farmer
//   socket.on("expertReply", ({ farmerId, text }) => {
//     if (!text) return;
//     io.to(farmerId).emit("receiveMessage", { sender: "Expert", text });
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected:", socket.id);
//   });
// });

// // --- Python API Call ---
// async function getPredictionFromPython(imagePath) {
//   const form = new FormData();
//   form.append("image", fs.createReadStream(imagePath));

//   const res = await fetch("http://localhost:8000/predict", {
//     method: "POST",
//     body: form,
//   });
//   const data = await res.json();
//   if (data.error) throw new Error(data.error);
//   return data.prediction;
// }

// // --- Image upload API ---
// app.post("/upload", upload.single("image"), async (req, res) => {
//   const { farmerId } = req.body;
//   const imagePath = req.file.path;
//   const farmerSocket = io.sockets.sockets.get(farmerId);

//   if (!farmerSocket)
//     return res.status(400).json({ error: "Farmer socket not found." });

//   if (farmerSocket.data.mode === "expert") {
//     // Send image only to experts
//     io.sockets.sockets.forEach((s) => {
//       if (s.data.role === "expert") {
//         s.emit("expertImage", {
//           farmerId: farmerSocket.id,
//           imageUrl: imagePath,
//         });
//       }
//     });

//     return res.json({
//       reply: "📤 Image sent to expert for analysis.",
//       imageUrl: imagePath,
//     });
//   } else {
//     try {
//       // Call Python prediction API
//       const prediction = await getPredictionFromPython(imagePath);
//       console.log("Prediction from Python API:", prediction);

//       // Send prediction to Gemini AI
//       const prompt = `A farmer uploaded an image of a crop.
// The AI model predicts it as "${prediction}".
// Provide detailed advice: plant disease description, causes, and solutions/treatment.`;

//       const aiReply = await getAIReply({ prompt });

//       return res.json({
//         reply: aiReply,
//         prediction,
//         imageUrl: imagePath,
//       });
//     } catch (error) {
//       console.error("Error:", error);
//       return res
//         .status(500)
//         .json({ error: "Failed to get prediction or AI advice." });
//     }
//   }
// });

// // --- Gemini AI Helper ---
// async function getAIReply({ prompt, imagePath, mimeType }) {
//   try {
//     const parts = [{ text: prompt }];
//     if (imagePath && mimeType) {
//       const base64Data = fs.readFileSync(imagePath).toString("base64");
//       parts.push({ inlineData: { mimeType, data: base64Data } });
//     }

//     const result = await aiModel.generateContent({
//       contents: [{ role: "user", parts }],
//     });
//     return result.response.text();
//   } catch (error) {
//     console.error("AI API error:", error);
//     return "⚠️ Error contacting AI service.";
//   }
// }

// // --- Start Server ---
// const PORT = process.env.PORT || 5000;
// httpServer.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT} 🚀`);
// });

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
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not defined in the .env file");
}

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors({ origin: "*" }));
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// Socket.IO events
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

    if (msg.toLowerCase().includes("expert")) {
      socket.data.mode = "expert";
      socket.emit("receiveMessage", {
        sender: "System",
        text: "✅ You are now connected to a human expert!",
      });
      return;
    }

    if (socket.data.mode === "expert") {
      // send to all experts
      for (const s of io.sockets.sockets.values()) {
        if (s.data.role === "expert") {
          s.emit("expertMessage", { farmerId: socket.id, text: msg });
        }
      }
    } else {
      msg = msg + ". Give the reply in HTML format only";
      const aiReply = await getAIReply({ prompt: msg });
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

// Function to get prediction from Python API
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

// Upload route
app.post("/upload", upload.single("image"), async (req, res) => {
  const { farmerId } = req.body;
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });

  const imagePath = req.file.path;
  const imageUrl = `http://localhost:5000/${imagePath.replace(/\\/g, "/")}`;
  const farmerSocket = io.sockets.sockets.get(farmerId);

  if (!farmerSocket)
    return res.status(400).json({ error: "Farmer socket not found." });

  if (farmerSocket.data.mode === "expert") {
    // Send image to all experts
    for (const s of io.sockets.sockets.values()) {
      if (s.data.role === "expert") {
        s.emit("expertImage", { farmerId: farmerSocket.id, imageUrl });
      }
    }

    return res.json({
      reply: "📤 Image sent to expert for analysis.",
      imageUrl,
    });
  } else {
    try {
      const prediction = await getPredictionFromPython(imagePath);

      const prompt = `A farmer uploaded an image of a crop. 
The AI model predicts it as "${prediction}". 
Provide detailed advice: plant disease description, causes, and solutions/treatment.Give the 
answer in HTML format only`;

      const aiReply = await getAIReply({ prompt });

      return res.json({
        reply: aiReply,
        prediction,
        imageUrl,
      });
    } catch (error) {
      console.error("Error:", error);
      return res
        .status(500)
        .json({ error: "Failed to get prediction or AI advice." });
    }
  }
});

// AI reply function
async function getAIReply({ prompt, imagePath, mimeType }) {
  try {
    const parts = [{ text: prompt }];
    if (imagePath && mimeType) {
      const base64Data = fs.readFileSync(imagePath).toString("base64");
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const result = await aiModel.generateContent({
      contents: [{ role: "user", parts }],
    });

    return result.response.text();
  } catch (error) {
    console.error("AI API error:", error);
    return "⚠ Error contacting AI service.";
  }
}

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
