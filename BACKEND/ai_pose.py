import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

image = cv2.imread("test.jpg")

rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

results = pose.process(rgb)

if results.pose_landmarks:
    print("Pose Detected")
else:
    print("No Pose Detected")
    