import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/style/style.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App, { loader as appLoader } from "./App";

import SignUp from "./routes/signup";
import EmailOrPhoneSign from "./components/EmailSignUp";
import Otp from "./components/Confrimation";
import Login from "./routes/login";
import AuthProvider from "./routes/context";
import LoginOrRegister from "./components/LoginOrRegister";
import Chat from "./pages/Chat";
import ConversationLayOut, { loader as conversationLoader } from "./pages/Conversation"
import UserProfile from "./pages/Profile";
const routes = createBrowserRouter(
  [
    {
      path: '/', element: <App />, loader: appLoader, children: [
        { path: 'login', element: <Login /> },
        {
          path: 'register', element: <SignUp />, children:
            [
              { index: true, element: <EmailOrPhoneSign /> },
              { path: 'confirmation', element: <Otp /> },
              { path: 'continue', element: <LoginOrRegister /> }
            ]
        },

      ]
    },
    {
      path: 'conversations', element: <ConversationLayOut />, loader: conversationLoader, children: [

        { path: 'chat/:chatId', element: <Chat /> },

        { path: 'profile', element: <UserProfile /> },
      ]
    },
  ]
);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={routes} />
    </AuthProvider>
  </StrictMode>,
);
