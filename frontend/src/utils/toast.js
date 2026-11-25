/**
 * Global Pill Toast Notification Manager.
 * Handles auto-dismiss (2s for success, 3s for error), duplicate prevention, and clean stacking.
 */

let listeners = [];
let toasts = [];

function notifyListeners() {
	listeners.forEach((fn) => fn([...toasts]));
}

export function subscribeToasts(fn) {
	listeners.push(fn);
	fn([...toasts]);
	return () => {
		listeners = listeners.filter((l) => l !== fn);
	};
}

export function dismissToast(id) {
	const item = toasts.find((t) => t.id === id);
	if (item && !item.dismissing) {
		item.dismissing = true;
		notifyListeners();

		// Wait for the exit animation (220ms) before removing from DOM
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
			notifyListeners();
		}, 220);
	}
}

export function showToast({ type = 'success', message = '', title, duration }) {
	const cleanMessage = String(message).trim();

	// Deduplication: prevent stacking identical active toasts
	const isDuplicate = toasts.some(
		(t) => t.type === type && t.message === cleanMessage && !t.dismissing,
	);
	if (isDuplicate) return null;

	const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	const autoDuration = duration ?? (type === 'success' ? 2000 : 3000);

	const newToast = {
		id,
		type,
		title: title || (type === 'success' ? 'Success' : 'Oops'),
		message: cleanMessage,
		dismissing: false,
	};

	toasts = [...toasts.slice(-2), newToast];
	notifyListeners();

	if (autoDuration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, autoDuration);
	}

	return id;
}

export const notify = {
	success: (message, options = {}) =>
		showToast({
			type: 'success',
			message,
			duration: 2000,
			...options,
		}),

	error: (message, options = {}) =>
		showToast({
			type: 'error',
			message,
			duration: options?.duration ?? 3000,
			...options,
		}),

	apiError: (error, fallback = 'Something went wrong. Please try again.') => {
		const message =
			error?.message || (typeof error === 'string' ? error : fallback);
		return notify.error(message);
	},

	dismiss: dismissToast,
};

export const toast = notify;
export default notify;
