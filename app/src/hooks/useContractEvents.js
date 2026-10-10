
import { useEffect } from "react";
import { listenToContractEvent } from "../services/contractEvents";

export default function useContractEvents(eventNames, onEvent) {
  useEffect(() => {
    const cleanups = eventNames.map((eventName) =>
      listenToContractEvent(eventName, onEvent)
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [eventNames, onEvent]);
}