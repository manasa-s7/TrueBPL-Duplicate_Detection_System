import cv2
import numpy as np
import base64
from typing import Optional, Tuple, List
from deepface import DeepFace
import json
from io import BytesIO
from PIL import Image

class FaceRecognitionService:
    def __init__(self, model_name: str = "Facenet512"):
        self.model_name = model_name
        self.distance_metric = "cosine"

    def extract_face_embedding(self, image_data: bytes) -> Optional[str]:
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                raise ValueError("Failed to decode image")

            embedding_objs = DeepFace.represent(
                img_path=img,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend="opencv"
            )

            if embedding_objs and len(embedding_objs) > 0:
                embedding = embedding_objs[0]["embedding"]
                return json.dumps(embedding)

            return None
        except Exception as e:
            print(f"Error extracting face embedding: {str(e)}")
            return None

    def compare_faces(self, embedding1_str: str, embedding2_str: str) -> Tuple[bool, float]:
        try:
            embedding1 = np.array(json.loads(embedding1_str))
            embedding2 = np.array(json.loads(embedding2_str))

            if self.distance_metric == "cosine":
                distance = self._cosine_distance(embedding1, embedding2)
            elif self.distance_metric == "euclidean":
                distance = np.linalg.norm(embedding1 - embedding2)
            else:
                distance = self._cosine_distance(embedding1, embedding2)

            threshold = 0.4 if self.distance_metric == "cosine" else 10
            is_match = distance < threshold
            confidence = (1 - distance) * 100 if self.distance_metric == "cosine" else max(0, (1 - distance/20) * 100)

            return is_match, round(confidence, 2)
        except Exception as e:
            print(f"Error comparing faces: {str(e)}")
            return False, 0.0

    def _cosine_distance(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 1.0

        cosine_similarity = dot_product / (norm1 * norm2)
        return 1 - cosine_similarity

    def verify_face_from_image(self, image_data: bytes, stored_embedding: str) -> Tuple[bool, float]:
        try:
            new_embedding = self.extract_face_embedding(image_data)

            if new_embedding is None:
                return False, 0.0

            is_match, confidence = self.compare_faces(new_embedding, stored_embedding)
            return is_match, confidence
        except Exception as e:
            print(f"Error verifying face: {str(e)}")
            return False, 0.0

    def detect_face_in_image(self, image_data: bytes) -> bool:
        try:
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return False

            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            return len(faces) > 0
        except Exception as e:
            print(f"Error detecting face: {str(e)}")
            return False

    def base64_to_bytes(self, base64_string: str) -> bytes:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        return base64.b64decode(base64_string)

face_service = FaceRecognitionService()
