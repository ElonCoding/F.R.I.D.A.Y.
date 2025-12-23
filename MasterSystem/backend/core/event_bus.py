import asyncio
from typing import Callable, Dict, List, Any
from loguru import logger
from enum import Enum
from dataclasses import dataclass, field
import datetime

class EventType(Enum):
    SYSTEM_STARTUP = "system.startup"
    SYSTEM_SHUTDOWN = "system.shutdown"
    
    # Sensory Events
    VOICE_COMMAND_DETECTED = "sense.voice.command"
    USER_PRESENCE_DETECTED = "sense.vision.presence"
    USER_IDENTIFIED = "sense.vision.identified"
    USER_LOST = "sense.vision.lost"
    USER_EMOTION_DETECTED = "sense.vision.emotion"
    
    # Brain Events
    INTENT_RECOGNIZED = "brain.intent.recognized"
    RESPONSE_GENERATED = "brain.response.generated"
    
    # Action Events
    EXECUTE_OS_COMMAND = "action.os.command"
    EXECUTE_SMART_HOME = "action.smarthome.command"
    
    # Feedback Events
    TTS_SPEAKING_START = "feedback.tts.start"
    TTS_SPEAKING_END = "feedback.tts.end"

@dataclass
class Event:
    type: EventType
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime.datetime = field(default_factory=datetime.datetime.now)

class EventBus:
    def __init__(self):
        self.subscribers: Dict[EventType, List[Callable[[Event], Any]]] = {}
        logger.info("EventBus initialized")

    def subscribe(self, event_type: EventType, handler: Callable[[Event], Any]):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
        logger.debug(f"Subscribed to {event_type.value}: {handler.__name__}")

    async def publish(self, event: Event):
        if event.type in self.subscribers:
            logger.info(f"Event Published: {event.type.value} | Data: {event.data}")
            handlers = self.subscribers[event.type]
            # Execute all handlers concurrently
            await asyncio.gather(*[self._execute_handler(h, event) for h in handlers])
        else:
            logger.debug(f"Event Published (No Listeners): {event.type.value}")

    async def _execute_handler(self, handler, event):
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(event)
            else:
                handler(event)
        except Exception as e:
            logger.error(f"Error handling event {event.type.value}: {e}")

# Global instance
bus = EventBus()
