import { redirect } from "react-router-dom";
import { useNavigate } from "react-router-dom";
// import illustrationVideo from "./assets/icons/Chat-app.mp4";
// import logo from "./assets/icons/logo.jpg";
import group from "./assets/icons/groupchaticon.svg";
export default function App() {
  const navigate = useNavigate()
  return (
    <div className="p-5 m-3 flex flex-col">
      <div>
        <h3 className="text-2xl">welcome to</h3>
        <h2 className="text-7xl font-semibold font-serif bg-linear-to-r from-green-500 to-[#362828] bg-clip-text text-transparent">
          Qill
        </h2>
        {/* <img src={logo} className="w-[100px]" alt="" /> */}
      </div>
      <div>
        {/* <video
          src={illustrationVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-3xl"
        ></video> */}
        <img src={group} alt="" />
      </div>
      <div>
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

