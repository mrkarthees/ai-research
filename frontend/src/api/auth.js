import { apiPost } from './client';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

// Both return the server message so the page can show it in a toast.
export const registerUser = async (payload) =>
	(await apiPost('/api/v1/users/register', payload)).message;

export const loginUser = async (credentials) => {
	const { data, message } = await apiPost('/api/v1/users/login', credentials);

	localStorage.setItem(TOKEN_KEY, data.accessToken);
	localStorage.setItem(USER_KEY, JSON.stringify(data.user));

	return message;
};

export const logoutUser = () => {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
	try {
		return JSON.parse(localStorage.getItem(USER_KEY));
	} catch {
		return null;
	}
};

const tokenExpiry = (token) => {
	try {
		const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');

		return JSON.parse(atob(base64)).exp ?? null;
	} catch {
		return null;
	}
};

// A token that is missing or expired means the user is signed out.
export const isAuthenticated = () => {
	const token = getToken();

	if (!token) return false;

	const expiry = tokenExpiry(token);

	if (expiry && expiry * 1000 < Date.now()) {
		logoutUser();
		return false;
	}

	return true;
};
