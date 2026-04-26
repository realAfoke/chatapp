import menuIcon from "../assets/icons/menu2.svg";
import profileIcon from "../assets/icons/profileIcon.svg"
import { useAuth } from "../routes/context";
import { useNavigate } from "react-router-dom";
export default function Menu({ handleProfile }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  return (
    <div className="text-base md:text-lg lg:text-xl bg-[#336333] font-serif text-white text-4xl p-3 py-4 flex justify-between">
      <div>     Qill </div>
      <div>
        <img src={profileIcon} className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 rounded-full" onClick={() => {
          if (isAuthenticated) {
            handleProfile(true)
            navigate('profile')
          } else {
            navigate('/login')
          }
        }} />
      </div>
    </div>
  );
}

{
  /* <div className="bg-green-700">
        <img src={menuIcon} alt="" className="w-15 h-15" />
      </div>
      <div className="hidden">
        <ul className="list-none *:p-3">
          <li>
            <a href="">Connections</a>
          </li>
          <li>
            <a href="">Request</a>
          </li>
          <li>
            <a href="">Connect</a>
          </li>
        </ul>
      </div> */
}
