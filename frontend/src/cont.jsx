import { useState, createContext, useContext, useEffect } from "react";
import { api } from "./utils";

const AuthContext = createContext()

export function AuthProvider({ children }) {
	const [auth, setAuth] = useState({ user: null, loader: false, token: localStorage.getItem('access'), isAuthenticated: false })

	useEffect(() => {

		const checkUser = async () => {
			try {
				if (!auth.token) {
					setAuthToken(setAuth)
				}
				if (auth.token) {
					const user = await api.get('/api/me/')
					setAuth((prev) => ({ ...prev, user: user.data, isAuthenticated: true }))
				}
			} catch (error) {
				setAuth({ user: null, loader: false, isAuthenticated: false })
				console.error(error)
			}
		}
		checkUser()
	}, [auth.token])


	return (
		<AuthContext.Provider value={{ ...auth, setAuth }}>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => useContext(AuthContext)
