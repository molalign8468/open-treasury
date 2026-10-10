
import { getReadOnlyContract } from "./budgetRegistry";

export function listenToContractEvent(eventName, callback) {
  const contract = getReadOnlyContract();

  const handler = (...args) => {
    // ethers v6 appends the event log as the final argument
    const eventLog = args[args.length - 1];

    callback({
      eventName,
      args: args.slice(0, -1),
      transactionHash: eventLog?.log?.transactionHash,
    });
  };

  contract.on(eventName, handler);

  // Return a cleanup function for React useEffect
  return () => {
    contract.off(eventName, handler);
  };
}