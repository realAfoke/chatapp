import { Outlet, useOutletContext } from "react-router-dom";
import LoginOrRegister from "../components/LoginOrRegister";
export default function Login() {
  const { errorLoader } = useOutletContext()
  return (
    <div className="flex flex-col  justify-center h-screen">
      <div className="flex justify-center flex-col items-center py-5">
        <h2 className="text-5xl font-semibold font-serif bg-linear-to-r from-green-500 to-[#362828] bg-clip-text text-transparent">
          Qill
        </h2>
        <span>Login to start interacting</span>
      </div>
      {errorLoader.error && <div className="text-red-500 text-sm md:text-base lg:text-lg text-center">{errorLoader.error}</div>}
      <LoginOrRegister />
    </div>
  );
}



