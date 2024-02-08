// easy maintain unlike stupid complexity
import { debounce } from "lodash";
import { UNFINISHED_INPUT } from "../constant";
import { ChatCommandPrefix } from "../command";

// Function to clear unfinished input from local storage for a given session ID
export const clearUnfinishedInputForSession = (sessionId: string) => {
    const key = UNFINISHED_INPUT(sessionId);
    localStorage.removeItem(key);
};

// Initialize the debounced function outside of the useCallback.
export const debouncedSave = debounce((input, key) => {
    if (input && !input.startsWith(ChatCommandPrefix)) {
        localStorage.setItem(key, input);
    } else {
        localStorage.removeItem(key);
    }
}, 500);
