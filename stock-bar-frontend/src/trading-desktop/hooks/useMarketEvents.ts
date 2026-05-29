import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketEvents } from "../services/marketEventsApi";
import type { MarketEvent, MarketEventDraft } from "../types";

function formatEventId(nextValue: number) {
  return `EVT-${String(nextValue).padStart(6, "0")}`;
}

export function useMarketEvents() {
  const eventSequence = useRef(1);
  const [events, setEvents] = useState<MarketEvent[]>([]);

  const refreshMarketEvents = useCallback(async () => {
    try {
      const backendEvents = await getMarketEvents();
      setEvents(backendEvents);
    } catch (error) {
      console.error("Market events load failed", error);
    }
  }, []);

  useEffect(() => {
    refreshMarketEvents();
  }, [refreshMarketEvents]);

  const addMarketEvent = useCallback((eventData: MarketEventDraft) => {
    const nextEvent: MarketEvent = {
      id: formatEventId(eventSequence.current),
      timestamp: new Date().toISOString(),
      type: eventData.type,
      description: eventData.description,
      user: eventData.user,
      status: eventData.status,
      details: eventData.details
    };

    eventSequence.current += 1;
    setEvents((currentEvents) => [nextEvent, ...currentEvents]);
    return nextEvent;
  }, []);

  const clearMarketEvents = useCallback(() => {
    setEvents([]);
    eventSequence.current = 1;
  }, []);

  return {
    events,
    refreshMarketEvents,
    addMarketEvent,
    clearMarketEvents
  };
}
