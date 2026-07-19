/**
 * Debounce utilitaire (equivalent lodash.debounce).
 */
export function debounce(fn, waitMs = 1000) {
    let timeoutId = null;

    const debounced = (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
        }, waitMs);
    };

    debounced.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}
