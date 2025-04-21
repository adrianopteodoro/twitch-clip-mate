/**
 * Logs debug messages to the console if DEBUG_MODE is enabled.
 * @param {string} message - The debug message to log.
 */
const debugLog = (message) => {
    const isDebugMode = process.env.DEBUG_MODE === "true";

    if (isDebugMode) {
        console.log(message);
    }
};

export default debugLog;