import { api } from "../utils";
import { useLoaderData, Navigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState, useContext, createContext } from "react";
import { normalise } from "../utils/chatUtil";
import { setAuthToken } from "../utils";
// import { setAuthToken } from "./utils";


const AuthContext = createContext()
export default function AuthProvider({ children }) {


  const [auth, setAuth] = useState({ user: null, token: localStorage.getItem('access'), isAuthenticated: false })


  useEffect(() => {

    const checkUser = async () => {
      try {
        if (!auth.token && !auth.isAuthenticated) return
        setAuthToken(setAuth)
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

  const chatWs = useRef(null)
  const [userStatus, setUserStatus] = useState([]);
  const userStatusRef = useRef(null);
  const [messages, setMessages] = useState({});
  const [userConversations, setUserConversations] = useState({});
  const [typing, setTyping] = useState({ isTyping: false, user: "" });
  const [connections, setConnections] = useState([]);
  //websocket state stuff
  const socketChat = useRef(null);


  return (
    <AuthContext.Provider
      value={{
        ...auth,
        setAuth,
        userConversations,
        setUserConversations,
        connections,
        setConnections,
        userStatus,
        messages,
        setMessages,
        socketChat,
        userStatusRef,
        setUserStatus,
        typing,
        setTyping,
        chatWs
      }} className="h-screen overflow-y-hidden border-2 border-red-500" >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)

