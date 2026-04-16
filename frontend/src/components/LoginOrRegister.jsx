import { useLocation } from "react-router-dom";
import { useState } from "react";
import { api } from "../utils";
import { useNavigate } from "react-router-dom";
export default function LoginOrRegister() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState({ error: false, loader: false });
  const fieldName = location.state
    ? Object.keys(location.state)[0]
    : "identifier";
  const [userData, setUserData] = useState({
    [fieldName]: location.state ? location.state[fieldName] : "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const path = location.pathname.split("/").filter((p) => p != "");
  async function createAccount() {
    try {
      const requestBody = { ...userData };
      delete requestBody.confirmPassword;
      await api.post("api/auth/register/", requestBody);
      navigate("/conversation", { replace: true });
    } catch (error) {
      conseole.error('ERROR:', error)
      console.error(error?.response);
      const { data } = error?.response;
      setPageData((prev) => ({
        ...prev,
        error: data.detail,
        loader: false,
      }));
    }
  }
  async function loginHandler() {
    try {
      await api.post("api/auth/login/", {
        username: userData[fieldName],
        password: userData.password,
      });
      navigate("/conversation", { replace: true });
    } catch (error) {
      console.error(error.response);
      const { data } = error.response;
      console.log(data);
      setPageData((prev) => ({
        ...prev,
        error: data.detail,
        loader: false,
      }));
    }
  }
  return (
    <div className="p-3">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="username"
          className="text-green-700 font-semibold text-xl"
        >
          username
        </label>
        <input
          type={
            fieldName === "email"
              ? "email"
              : fieldName === "phone"
                ? "tel"
                : "text"
          }
          placeholder={
            path.includes("continue")
              ? "Enter username"
              : "Enter username,email or phone"
          }
          value={
            path.includes("continue") ? userData.username : userData[fieldName]
          }
          onChange={(e) => {
            setUserData((prev) => {
              if (path.includes("continue")) {
                return { ...prev, username: e.target.value };
              } else {
                return { ...prev, [fieldName]: e.target.value };
              }
            });
          }}
          className="outline-none ring ring-green-500 rounded-[5px] p-3"
        />
        <label
          htmlFor="password"
          className="text-green-700 font-semibold text-xl"
        >
          password
        </label>
        <input
          type="password"
          value={userData.password}
          onChange={(e) =>
            setUserData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="outline-none ring ring-green-500 rounded-[5px] p-3"
          placeholder="Enter password"
        />
        {path.includes("register") && (
          <div className="flex flex-col">
            <label
              htmlFor="confirmPassword"
              className="text-green-700 font-semibold text-xl"
            >
              confrim password
            </label>
            <input
              type="password"
              className="outline-none ring ring-green-500 rounded-[5px] p-3"
            />
          </div>
        )}
        {pageData.error && (
          <span className="text-red-500 text-[18px] font-medium">
            {pageData.error}
          </span>
        )}
        <button
          className="p-2 my-2 rounded-[5px] px-6 outline-none bg-green-500 text-white font-semibold self-center "
          onClick={async () => {
            if (path.includes("continue")) {
              await createAccount();
            } else {
              await loginHandler();
            }
          }}
        >
          {path.includes("login") ? "login" : "signUp"}
        </button>
      </div>
    </div>
  );
}
