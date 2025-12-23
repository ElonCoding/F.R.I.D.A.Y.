from backend.core.event_bus import bus, Event, EventType
from loguru import logger
import asyncio
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class BrainModule:
    def __init__(self):
        bus.subscribe(EventType.VOICE_COMMAND_DETECTED, self.process_command)
        bus.subscribe(EventType.USER_IDENTIFIED, self.greet_user)
        bus.subscribe(EventType.USER_EMOTION_DETECTED, self.update_emotion_context)
        
        self.emotion_context = "Neutral"
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        if self.api_key and "YOUR_API_KEY" not in self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.chat = self.model.start_chat(history=[])
            # Set system instruction via initial prompt or config if supported
            self.system_prompt = (
                "You are the MASTER SYSTEM, a highly advanced, holographic AI assistant. "
                "You are efficient, professional, and slightly futuristic. "
                "You are NOT a chatbot; you are a command center. "
                "Keep responses concise and direct. Address the user as 'Sir'."
            )
            self.has_llm = True
            logger.info("Brain Module: Gemini AI Online")
        else:
            self.has_llm = False
            logger.warning("Brain Module: Gemini API Key missing or invalid. Falling back to simple logic.")

        logger.info("Brain Module Initialized")

    async def update_emotion_context(self, event: Event):
        self.emotion_context = event.data.get("emotion", "Neutral")

    async def greet_user(self, event: Event):
        user = event.data.get("user", "Sir")
        if self.has_llm:
            try:
                response = await self._query_llm(f"The user {user} has been identified via Face Auth. Brief welcome.")
                await self._respond(response)
            except Exception:
                await self._respond(f"Identity confirmed. Welcome back, {user}.")
        else:
            await self._respond(f"Identity confirmed. Welcome back, {user}.")

    async def process_command(self, event: Event):
        text = event.data.get("text", "").lower()
        logger.info(f"Brain processing: {text}")

        if not self.has_llm:
            # Fallback Logic
            if "hello" in text:
                response = "Greetings, Sir."
            elif "status" in text:
                response = "System operational. Gemini AI is offline."
            else:
                response = "I heard you, but my higher brain functions are offline."
            await self._respond(response)
            return

        # LLM Logic
        prompt = f"[User Emotion: {self.emotion_context}] User says: {text}"
        try:
            response_text = await self._query_llm(prompt)
            await self._respond(response_text)
        except Exception as e:
            logger.error(f"LLM Error: {e}")
            await self._respond("I am encountering processing errors, Sir.")

    async def _query_llm(self, prompt):
        # We prepend system prompt manually if chat history doesn't persist it well or use it as context
        # Ideally, we send context.
        # For simplicity in this loop:
        full_response = await asyncio.to_thread(
            self.chat.send_message, 
            f"{self.system_prompt}\n\n{prompt}"
        )
        return full_response.text

    async def _respond(self, text):
        logger.info(f"Brain Response: {text}")
        await bus.publish(Event(EventType.RESPONSE_GENERATED, {"text": text}))

brain_module = BrainModule()

