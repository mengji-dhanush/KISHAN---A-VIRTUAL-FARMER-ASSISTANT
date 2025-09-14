# predict_server.py
from flask import Flask, request, jsonify
import joblib
import numpy as np
from skimage.io import imread
from skimage.transform import resize
from skimage.color import gray2rgb

# Load model and classes
model = joblib.load("disease_classifier.pkl")
classes = joblib.load("classes.pkl")

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = imread(file)

    # Preprocess
    if img.ndim == 2:
        img = gray2rgb(img)
    elif img.shape[2] == 4:
        img = img[:, :, :3]

    img_resized = resize(img, (64, 64), anti_aliasing=True)
    img_flat = img_resized.flatten().reshape(1, -1)

    # Predict
    pred_idx = model.predict(img_flat)[0]
    pred_class = classes[pred_idx]

    return jsonify({"prediction": pred_class})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
