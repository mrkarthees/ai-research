import { Route, Routes } from 'react-router-dom';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Authentication/Login';
import { Signup } from './pages/Authentication/Signup';
import { LoginRequired } from './pages/Authentication/LoginRequired';
import { isAuthenticated } from './api/auth';

/**
 * Route guard component protecting authenticated views.
 */
function ProtectedRoute({ children }) {
	return isAuthenticated() ? children : <LoginRequired />;
}

export function App() {
	return (
		<>
			{/* Minimal Pill-Shaped Toast Notification at bottom-center */}
			<Toast />

			<Routes>
				<Route
					path='/'
					element={
						<ProtectedRoute>
							<Home />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/result'
					element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					}
				/>
				<Route path='/login' element={<Login />} />
				<Route path='/signup' element={<Signup />} />
			</Routes>
		</>
	);
}

export default App;
