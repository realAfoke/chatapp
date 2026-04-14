import { Outlet } from "react-router-dom";
export default function SignUp() {
  return (
    <div className="flex flex-col  justify-center h-screen">
      <div className="flex justify-center flex-col items-center py-5">
        <h2 className="text-5xl font-semibold font-serif bg-linear-to-r from-green-500 to-[#362828] bg-clip-text text-transparent">
          Qill
        </h2>
        <span>Join Earth group chat</span>
      </div>
      <Outlet />
    </div>
  );
}
