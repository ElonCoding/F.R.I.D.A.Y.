import cv2
import threading
import time
import asyncio
from loguru import logger
from backend.core.event_bus import bus, Event, EventType

# Try importing face_recognition (fallback removed/kept simplistic)
# Import FER
try:
    from fer import FER
    EMOTION_DETECTOR_AVAILABLE = True
except ImportError:
    EMOTION_DETECTOR_AVAILABLE = False
    logger.warning("FER library not found. Emotion detection disabled.")

class VisionModule:
    def __init__(self):
        self.camera_index = 0
        self.is_active = True
        self.cap = None
        self.detector = None
        
        if EMOTION_DETECTOR_AVAILABLE:
            # MTCNN=True is better but slower. Default uses OpenCV Haar Cascades
            try:
                self.detector = FER(mtcnn=False) 
            except Exception as e:
                logger.error(f"Failed to init FER: {e}")
                
        # Subscribe to startup/shutdown
        bus.subscribe(EventType.SYSTEM_STARTUP, self.start_camera)
        bus.subscribe(EventType.SYSTEM_SHUTDOWN, self.stop_camera)
        
        logger.info("Vision Module Initialized (Emotion Capable)")

    async def start_camera(self, event: Event):
        logger.info("Starting Vision System...")
        self.is_active = True
        threading.Thread(target=self._vision_loop, daemon=True).start()

    async def stop_camera(self, event: Event):
        self.is_active = False
        if self.cap:
            self.cap.release()

    def _vision_loop(self):
        self.cap = cv2.VideoCapture(self.camera_index)
        
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

        last_detection_time = 0
        last_emotion_time = 0
        
        while self.is_active:
            ret, frame = self.cap.read()
            if not ret:
                time.sleep(1)
                continue

            # Optimize: Process faces
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)

            current_time = time.time()

            if len(faces) > 0:
                # Presence Event (Debounced 5s)
                if current_time - last_detection_time > 5:
                    logger.info("User Face Detected")
                    asyncio.run_coroutine_threadsafe(
                        bus.publish(Event(EventType.USER_PRESENCE_DETECTED)),
                        asyncio.get_event_loop()
                    )
                    asyncio.run_coroutine_threadsafe(
                        bus.publish(Event(EventType.USER_IDENTIFIED, {"user": "Master"})),
                        asyncio.get_event_loop()
                    )
                    last_detection_time = current_time

                # Emotion Detection (Debounced 3s to save CPU)
                if self.detector and current_time - last_emotion_time > 3:
                    try:
                        # FER expects RGB
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        # Detect top emotion
                        emotion, score = self.detector.top_emotion(rgb_frame)
                        
                        if emotion and score is not None and score > 0.4:
                            logger.info(f"Emotion Detected: {emotion} ({score})")
                            asyncio.run_coroutine_threadsafe(
                                bus.publish(Event(EventType.USER_EMOTION_DETECTED, {"emotion": emotion})),
                                asyncio.get_event_loop()
                            )
                    except Exception as e:
                        logger.error(f"Emotion Error: {e}")
                    
                    last_emotion_time = current_time
            
            time.sleep(0.1) # 10 FPS

vision_module = VisionModule()
