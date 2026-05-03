import { Outlet, redirect, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
// import illustrationVideo from "./assets/icons/Chat-app.mp4";
// import logo from "./assets/icons/logo.jpg";
import group from "./assets/icons/groupchaticon.svg";
import { useState } from "react";
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [errorLoader, setErrorLoader] = useState({ loader: false, error: false })
  const currentRoute = location.pathname
  useEffect(() => {

    if (!errorLoader.loader) return
    const interval = setInterval(setProgress((p) => (p < 80 ? p + 80 : p)), 100)
    return () => clearInterval(interval)

  }, [errorLoader])
  return (
    <div className="flex flex-col md:flex-row lg:flex-row p-3 overflow-hidden h-screen">
      <DashBoard currentRoute={currentRoute} />
      <div className={`${currentRoute.length > 1 ? 'flex-1 shadow-sm px-2 md:px-3 lg:px-5' : 'hidden'}`} >
        <div className="w-full h-1 rounded">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <Outlet context={{ errorLoader, setErrorLoader, setProgress }} />
      </div>
    </div >
  )

}
export function DashBoard({ currentRoute }) {
  const navigate = useNavigate()
  return (
    <div className={`flex ${currentRoute.length > 1 ? 'hidden  md:flex md:flex-row  lg:flex lg:flex-row' : ' flex-col justify-center p-3 md:flex-row lg:flex-row'} flex-1`}>
      <div className="flex-1">
        <div className="">
          <h3 className="text-2xl">welcome to</h3>
          <h2 className="text-7xl font-semibold font-serif bg-linear-to-r from-green-500 to-[#362828] bg-clip-text text-transparent">
            Qill
          </h2>
          {/* <img src={logo} className="w-[100px]" alt="" /> */}
        </div>
        <div className="">
          {/* <video
          src={illustrationVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-3xl"
        ></video> */}
          <img src={group} alt="" className="max-w-100 max-h-100" />
        </div>
      </div>
      <div className={`flex-1 px-2 md:px-[2rem] lg:px-[5rem] flex ${currentRoute.length > 1 ? 'hidden' : 'flex-col'}  }`}>
        <div className="flex flex-col">
          <h2 className="font-bold text-2xl py-3 text-green-500">
            Start the chat Adventure,jump into a Heart-to-Heart Connection!
          </h2>
        </div>
        <div>
          <p>
            Now is the time to start communication! Select a friend from you
            contact list or start a group chat .You can send a text
            mesage,photos,videos or even voice and video calls.
          </p>
        </div>
        <div className="flex justify-between py-5 my-5 ">
          <button
            className="outline-none border-0 text-white bg-black py-2 px-4 rounded-[5px]"
            onClick={() => navigate("login/")}
          >
            login
          </button>
          <button
            className="outline-none border-0 text-white bg-green-600 py-2 px-4 rounded-[5px]"
            onClick={() => navigate("register/")}
          >
            SingUp
          </button>
        </div>
      </div>
    </div >
  );
}

export async function loader() {
  try {
    const token = localStorage.get('access')
    if (!token) {
      throw new Error('user not logged in')
    }
    await api.get(`${import.meta.env.VITE_API_URL}/api/me/`)
    console.log("about to redirect!!!")
    return redirect('/conversations')
  } catch (error) {
    return
  }
}

