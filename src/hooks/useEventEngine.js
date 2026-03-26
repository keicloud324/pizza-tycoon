import { useCallback } from "react";
import { EVENTS } from "../config/events.js";

export default function useEventEngine(cityId, day, lastEventDay, update) {
  const checkForEvent = useCallback(() => {
    const daysSince = day - lastEventDay;
    if (daysSince < 7) return null;
    if (daysSince < 10 && Math.random() > 0.4) return null;

    // Pick an event
    const available = Object.entries(EVENTS).filter(([, e]) => {
      if (e.cityOnly && e.cityOnly !== cityId) return false;
      return true;
    });
    if (available.length === 0) return null;

    const [key, event] = available[Math.floor(Math.random() * available.length)];
    const duration = event.duration || 1;

    update(prev => ({
      lastEventDay: prev.day,
      activeEvents: [...prev.activeEvents, { ...event, key, daysLeft: duration }],
    }));

    return event;
  }, [cityId, day, lastEventDay, update]);

  return { checkForEvent };
}
