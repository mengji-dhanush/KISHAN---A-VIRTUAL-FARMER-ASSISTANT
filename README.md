<p align="center">
  <h1 align="center">🌾 KISHAN — A Virtual Farmer Assistant</h1>
  <p align="center">
    <em>Empowering farmers with AI-driven crop disease diagnosis, real-time chat support, and expert consultations.</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
    <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow"/>
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.IO"/>
    <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=ai&logoColor=white" alt="Groq"/>
  </p>
</p>

---

## 📖 About

**KISHAN** is an AI-powered virtual farming assistant designed to help farmers make smarter decisions, improve crop yields, and reduce losses. It provides:

- 🤖 **Instant AI Chat** — Ask any farming question and get immediate, context-aware responses powered by Groq (LLaMA 3.3 70B).
- 🔬 **Image-Based Disease Diagnosis** — Upload a photo of your crop and receive a CNN-powered prediction of the disease along with detailed treatment advice.
- 👨‍🌾 **Live Expert Connection** — Seamlessly switch from AI mode to a live human expert for personalized, in-depth consultations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (client.html)                  │
│         Browser-based chat UI with Socket.IO            │
└────────────┬───────────────────────┬────────────────────┘
             │  WebSocket (Chat)     │  HTTP POST (Image)
             ▼                       ▼
┌─────────────────────────────────────────────────────────┐
│               NODE.JS SERVER (server.js)                │
│    • Express + Socket.IO                                │
│    • Routes messages to AI or Expert                    │
│    • Handles image uploads via Multer                   │
│    • Calls Groq API for AI responses                    │
└────────────┬────────────────────────────────────────────┘
             │  HTTP POST (image → prediction)
             ▼
┌─────────────────────────────────────────────────────────┐
│           PYTHON ML SERVER (predict_server.py)          │
│    • Flask REST API on port 8000                        │
│    • Loads CNN model (plant_disease_cnn.h5)             │
│    • Returns disease prediction + confidence            │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 💬 **AI Chatbot** | Real-time conversational assistant powered by Groq (LLaMA 3.3 70B) for farming queries |
| 📸 **Crop Disease Detection** | CNN model trained on the PlantVillage dataset to classify **15 disease categories** across pepper, potato, and tomato crops |
| 🧑‍⚕️ **Expert Mode** | Type "expert" in chat to get routed to a live human specialist |
| 📤 **Image Upload** | Upload crop photos directly in chat for instant AI or expert analysis |
| 🔄 **Real-time Communication** | Socket.IO-powered bi-directional messaging between farmers and experts |
| 🌙 **Dark Mode UI** | Modern, sleek dark-themed interface for comfortable usage |

---

## 🧬 Supported Disease Classes

The CNN model identifies **15 classes** across 3 crop types:

<details>
<summary>Click to expand all 15 classes</summary>

| # | Crop | Class |
|---|------|-------|
| 1 | 🫑 Pepper (Bell) | Bacterial Spot |
| 2 | 🫑 Pepper (Bell) | Healthy |
| 3 | 🥔 Potato | Early Blight |
| 4 | 🥔 Potato | Late Blight |
| 5 | 🥔 Potato | Healthy |
| 6 | 🍅 Tomato | Bacterial Spot |
| 7 | 🍅 Tomato | Early Blight |
| 8 | 🍅 Tomato | Late Blight |
| 9 | 🍅 Tomato | Leaf Mold |
| 10 | 🍅 Tomato | Septoria Leaf Spot |
| 11 | 🍅 Tomato | Spider Mites (Two-Spotted) |
| 12 | 🍅 Tomato | Target Spot |
| 13 | 🍅 Tomato | Yellow Leaf Curl Virus |
| 14 | 🍅 Tomato | Mosaic Virus |
| 15 | 🍅 Tomato | Healthy |

</details>

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express 5** — HTTP and WebSocket server
- **Socket.IO** — Real-time bi-directional communication
- **Multer** — Image upload handling
- **Groq SDK** — AI responses via LLaMA 3.3 70B model
- **python-shell** — Bridge between Node.js and Python

### ML Server
- **Python** + **Flask** — REST API for serving predictions
- **TensorFlow / Keras** — CNN model inference
- **NumPy** — Array operations & preprocessing

### ML Models (Training)
- **CNN** — Custom Convolutional Neural Network (`CNN.ipynb`)
- **Random Forest** — Alternative classifier (`ML MODELS/random_forest.ipynb`)
- **XGBoost** — Gradient boosting classifier (`ML MODELS/XGBoost.ipynb`)

### Frontend
- **HTML / CSS / JavaScript** — Single-page chat interface
- **Socket.IO Client** — Real-time messaging

### Dataset
- [**PlantVillage**](https://www.kaggle.com/datasets/emmarex/plantdisease) — ~54,000+ leaf images across 15 classes (sourced from Kaggle)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **Python** 3.8+ with **pip**
- A [**Groq API Key**](https://console.groq.com/) for the AI chatbot

### 1. Clone the repository

```bash
git clone https://github.com/mengji-dhanush/KISHAN---A-VIRTUAL-FARMER-ASSISTANT.git
cd KISHAN---A-VIRTUAL-FARMER-ASSISTANT
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install flask tensorflow numpy
```

### 4. Set up environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Download / Train the CNN model

> The trained model file `plant_disease_cnn.h5` is required but not included in the repo (it's ~30 MB).

Option A — **Train from scratch** using Google Colab:
1. Open `CNN.ipynb` in Google Colab.
2. Upload your `kaggle.json` credentials.
3. Run all cells to download the PlantVillage dataset and train the model.
4. Download the generated `plant_disease_cnn.h5` file and place it in the project root.

Option B — **Use a pre-trained model** (if provided separately by a teammate).

### 6. Start the Python ML server

```bash
python predict_server.py
```

This starts the Flask prediction API on **`http://localhost:8000`**.

### 7. Start the Node.js server

```bash
node server.js
```

This starts the main server on **`http://localhost:5000`**.

### 8. Open the app

Open `client.html` in your browser, or navigate to `http://localhost:5000` if the file is served statically.

---

## 📁 Project Structure

```
KISHAN---A-VIRTUAL-FARMER-ASSISTANT/
├── client.html              # Frontend — Chat UI (HTML/CSS/JS)
├── server.js                # Backend — Node.js + Express + Socket.IO
├── predict_server.py        # ML Server — Flask API for disease prediction
├── plant_disease_cnn.h5     # Trained CNN model (not in repo)
├── CNN.ipynb                # Jupyter notebook — CNN training pipeline
├── ML MODELS/
│   ├── XGBoost.ipynb        # XGBoost classifier notebook
│   └── random_forest.ipynb  # Random Forest classifier notebook
├── PlantVillage/            # Raw dataset (not in repo)
├── PlantVillage_split/      # Train/test split (not in repo)
├── uploads/                 # Uploaded images directory (runtime)
├── package.json             # Node.js dependencies
├── .env                     # Environment variables (not in repo)
└── .gitignore               # Git ignore rules
```

---

## 💡 How It Works

### 🟢 AI Chat Flow
1. Farmer joins the chat and selects the **Farmer** role.
2. Types a farming-related question.
3. The message is sent via Socket.IO to the Node.js server.
4. Server forwards the query to **Groq AI (LLaMA 3.3 70B)**.
5. The AI response is streamed back to the farmer in real-time.

### 🟡 Disease Diagnosis Flow
1. Farmer uploads a crop leaf image via the chat.
2. The image is sent to the Node.js server via HTTP POST.
3. Server forwards the image to the **Python ML server** (`/predict`).
4. The CNN model classifies the disease and returns the prediction.
5. The prediction is then sent to **Groq AI** for a detailed explanation including symptoms, causes, and treatment.
6. The combined result (prediction + AI advice) is returned to the farmer.

### 🔵 Expert Mode Flow
1. Farmer types **"expert"** in the chat.
2. The system switches from AI mode to expert mode.
3. All subsequent messages and images from the farmer are forwarded to connected **experts**.
4. Experts can view the messages/images and reply directly to the farmer.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgements

- [PlantVillage Dataset](https://www.kaggle.com/datasets/emmarex/plantdisease) for the crop disease images
- [Groq](https://groq.com/) for ultra-fast AI inference
- [TensorFlow](https://www.tensorflow.org/) for the deep learning framework
- [Socket.IO](https://socket.io/) for real-time communication

---

<p align="center">
  <strong>🌱 "Empowering farmers with smart AI solutions." 🌱</strong>
</p>
