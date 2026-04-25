import { Outlet } from "react-router-dom";
import LoginOrRegister from "../components/LoginOrRegister";
export default function Login() {
  return (
    <div className="flex flex-col  justify-center h-screen">
      <div className="flex justify-center flex-col items-center py-5">
        <h2 className="text-5xl font-semibold font-serif bg-linear-to-r from-green-500 to-[#362828] bg-clip-text text-transparent">
          Qill
        </h2>
        <span>Login to start interacting</span>
      </div>
      <LoginOrRegister />
    </div>
  );
}

export async function loader() {
  try {
    const token = localStorage.get('access')
    if (!token) {
      throw new Error('user not logged in')
    }
    await api.get(`${import.meta.env.VITE_API_URL}/api/me/`)
    return redirect('/conversations')
  } catch (error) {
    return
  }
}

