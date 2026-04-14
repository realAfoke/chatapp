import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/style/style.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import SignUp from "./routes/signup";
import EmailOrPhoneSign from "./components/EmailSignUp";
import Otp from "./components/Confrimation";
import Login from "./routes/login";
import LoginOrRegister from "./components/LoginOrRegister";
import Home, { loader as homeLoader } from "./routes/home";
import Chat from "./pages/Chat";
import Conversation from "./pages/Conversation";
import ConversationListComponent from "./pages/Conversation";

const routes = createBrowserRouter([
  { path: "/", element: <App /> },
  {
    path: "register",
    element: <SignUp />,
    children: [
      { index: true, element: <EmailOrPhoneSign /> },
      { path: "confirmation", element: <Otp /> },
      { path: "continue", element: <LoginOrRegister /> },
    ],
  },
  { path: "login", element: <Login /> },
  {
    path: "conversation",
    element: <Home />,
    loader: homeLoader,
    children: [
      { index: true, element: <ConversationListComponent /> },
      { path: "chat/:conversationId", element: <Chat /> },
    ],
  },
]);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={routes} />
  </StrictMode>,
);
