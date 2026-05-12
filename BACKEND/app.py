# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
# pyrefly: ignore [missing-import]
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from werkzeug.utils import secure_filename
# pyrefly: ignore [missing-import]
from flask import send_from_directory
# pyrefly: ignore [missing-import]
from flask_sqlalchemy import SQLAlchemy
# pyrefly: ignore [missing-import]
from flask_bcrypt import Bcrypt
import datetime
import json

# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import mediapipe as mp
import os
import math
import uuid

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)

class History(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    verdict = db.Column(db.String(250))
    progress_percent = db.Column(db.Integer)
    body_ratio = db.Column(db.Float)
    posture_score = db.Column(db.Float)
    symmetry_score = db.Column(db.Float)
    confidence = db.Column(db.Float)
    old_front = db.Column(db.String(250))
    new_front = db.Column(db.String(250))
    old_side = db.Column(db.String(250))
    new_side = db.Column(db.String(250))
    advice = db.Column(db.Text)

with app.app_context():
    db.create_all()

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

mp_pose = mp.solutions.pose

pose = mp_pose.Pose(
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

mp_draw = mp.solutions.drawing_utils

def calculate_distance(p1, p2):

    return math.sqrt(
        (p2.x - p1.x) ** 2 +
        (p2.y - p1.y) ** 2
    )

def save_skeleton_image(image, results):

    annotated = image.copy()

    mp_draw.draw_landmarks(
        annotated,
        results.pose_landmarks,
        mp_pose.POSE_CONNECTIONS
    )

    filename = f"{uuid.uuid4()}.jpg"

    output_path = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    cv2.imwrite(output_path, annotated)

    return filename

def analyze_front(image_path):

    image = cv2.imread(image_path)

    rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    results = pose.process(rgb)

    if not results.pose_landmarks:
        return None

    skeleton_file = save_skeleton_image(
        image,
        results
    )

    landmarks = results.pose_landmarks.landmark

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_hip = landmarks[23]
    right_hip = landmarks[24]

    shoulder_width = calculate_distance(
        left_shoulder,
        right_shoulder
    )

    hip_width = calculate_distance(
        left_hip,
        right_hip
    )

    ratio = shoulder_width / hip_width

    symmetry_score = abs(
        left_shoulder.y -
        right_shoulder.y
    )

    visibility = (
        left_shoulder.visibility +
        right_shoulder.visibility +
        left_hip.visibility +
        right_hip.visibility
    ) / 4

    return {
        "ratio": ratio,
        "symmetry": symmetry_score,
        "visibility": visibility,
        "skeleton": skeleton_file
    }

def analyze_side(image_path):

    image = cv2.imread(image_path)

    rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    results = pose.process(rgb)

    if not results.pose_landmarks:
        return None

    skeleton_file = save_skeleton_image(
        image,
        results
    )

    landmarks = results.pose_landmarks.landmark

    shoulder = landmarks[11]
    hip = landmarks[23]
    ankle = landmarks[27]

    posture_score = abs(
        shoulder.x - ankle.x
    )

    torso_angle = abs(
        shoulder.x - hip.x
    )

    visibility = (
        shoulder.visibility +
        hip.visibility +
        ankle.visibility
    ) / 3

    return {
        "posture": posture_score,
        "torso": torso_angle,
        "visibility": visibility,
        "skeleton": skeleton_file
    }

@app.route("/uploads/<filename>")
def uploaded_file(filename):

    return send_from_directory(
        UPLOAD_FOLDER,
        filename
    )

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400
        
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400
        
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully", "user_id": new_user.id}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"message": "Login successful", "user_id": user.id, "username": user.username}), 200
        
    return jsonify({"error": "Invalid username or password"}), 401

@app.route("/history/<int:user_id>", methods=["GET"])
def get_history(user_id):
    histories = History.query.filter_by(user_id=user_id).order_by(History.date.desc()).all()
    results = []
    for h in histories:
        results.append({
            "id": h.id,
            "date": h.date.isoformat(),
            "verdict": h.verdict,
            "progressPercent": h.progress_percent,
            "metrics": {
                "bodyRatio": h.body_ratio,
                "postureScore": h.posture_score,
                "symmetryScore": h.symmetry_score,
                "confidence": h.confidence
            },
            "skeletons": {
                "oldFront": f"{request.host_url}uploads/{h.old_front}",
                "newFront": f"{request.host_url}uploads/{h.new_front}",
                "oldSide": f"{request.host_url}uploads/{h.old_side}",
                "newSide": f"{request.host_url}uploads/{h.new_side}"
            },
            "advice": json.loads(h.advice) if h.advice else []
        })
    return jsonify(results), 200

@app.route("/analyze", methods=["POST"])
def analyze():

    required_files = [
        "oldFront",
        "oldSide",
        "newFront",
        "newSide"
    ]

    for file_name in required_files:

        if file_name not in request.files:

            return jsonify({
                "verdict": "❌ Missing Images",
                "advice": [
                    "Please upload all four images."
                ]
            })

    saved_paths = {}

    for file_name in required_files:

        file = request.files[file_name]

        filename = secure_filename(file.filename)

        unique_name = (
            str(uuid.uuid4()) +
            "_" +
            filename
        )

        path = os.path.join(
            UPLOAD_FOLDER,
            unique_name
        )

        file.save(path)

        saved_paths[file_name] = path

    # ANALYSIS
    old_front = analyze_front(
        saved_paths["oldFront"]
    )

    new_front = analyze_front(
        saved_paths["newFront"]
    )

    old_side = analyze_side(
        saved_paths["oldSide"]
    )

    new_side = analyze_side(
        saved_paths["newSide"]
    )

    if (
        old_front is None or
        new_front is None or
        old_side is None or
        new_side is None
    ):

        return jsonify({
            "verdict": "❌ Pose Detection Failed",
            "advice": [
                "Use clearer standing photos.",
                "Ensure full body is visible."
            ]
        })

    advice = []

    # BODY RATIO
    ratio_difference = (
        new_front["ratio"] -
        old_front["ratio"]
    )

    # POSTURE
    posture_change = (
        old_side["posture"] -
        new_side["posture"]
    )

    # TORSO
    torso_change = (
        old_side["torso"] -
        new_side["torso"]
    )

    # SYMMETRY
    symmetry_change = (
        old_front["symmetry"] -
        new_front["symmetry"]
    )

    # PROGRESS %
    progress_score = (
        ratio_difference * 40 +
        posture_change * 30 +
        torso_change * 20 +
        symmetry_change * 10
    )

    progress_percent = max(
        0,
        min(
            int(progress_score * 100),
            100
        )
    )

    # ADVICE ENGINE
    if ratio_difference > 0.08:

        advice.append(
            "Upper-body proportions appear broader and more balanced."
        )

    elif ratio_difference > 0.03:

        advice.append(
            "Minor upper-body improvement detected."
        )

    else:

        advice.append(
            "Limited visible upper-body structural change detected."
        )

    if posture_change > 0.04:

        advice.append(
            "Standing posture appears significantly improved."
        )

    elif posture_change > 0:

        advice.append(
            "Slight posture improvement detected."
        )

    else:

        advice.append(
            "Posture alignment appears mostly unchanged."
        )

    if symmetry_change > 0:

        advice.append(
            "Shoulder alignment appears more symmetrical."
        )

    # FINAL VERDICT
    if progress_percent >= 70:

        verdict = "🔥 Major Visible Progress"

    elif progress_percent >= 40:

        verdict = "✅ Moderate Progress"

    elif progress_percent >= 15:

        verdict = "⚡ Slight Improvement"

    else:

        verdict = "📈 Minimal Visible Change"

    user_id = request.form.get("user_id")
    if user_id and user_id != 'null':
        new_history = History(
            user_id=int(user_id),
            verdict=verdict,
            progress_percent=progress_percent,
            body_ratio=round(new_front["ratio"], 2),
            posture_score=round(new_side["posture"], 3),
            symmetry_score=round(new_front["symmetry"], 3),
            confidence=round((new_front["visibility"] + new_side["visibility"]) / 2, 2),
            old_front=old_front['skeleton'],
            new_front=new_front['skeleton'],
            old_side=old_side['skeleton'],
            new_side=new_side['skeleton'],
            advice=json.dumps(advice)
        )
        db.session.add(new_history)
        db.session.commit()

    return jsonify({

        "verdict": verdict,

        "progressPercent": progress_percent,

        "metrics": {

            "bodyRatio": round(
                new_front["ratio"],
                2
            ),

            "postureScore": round(
                new_side["posture"],
                3
            ),

            "symmetryScore": round(
                new_front["symmetry"],
                3
            ),

            "confidence": round(
                (
                    new_front["visibility"] +
                    new_side["visibility"]
                ) / 2,
                2
            )
        },

        "advice": advice,

        "skeletons": {

            "oldFront":
            f"{request.host_url}uploads/{old_front['skeleton']}",

            "newFront":
            f"{request.host_url}uploads/{new_front['skeleton']}",

            "oldSide":
            f"{request.host_url}uploads/{old_side['skeleton']}",

            "newSide":
            f"{request.host_url}uploads/{new_side['skeleton']}"
        }
    })

if __name__ == "__main__":
    app.run(debug=True)