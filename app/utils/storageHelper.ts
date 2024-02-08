// easy maintain unlike stupid complexity
import { UNFINISHED_INPUT } from "../constant";

// Function to clear unfinished input from local storage for a given session ID
export const clearUnfinishedInputForSession = (sessionId: string) => {
    const key = UNFINISHED_INPUT(sessionId);
    localStorage.removeItem(key);
};
