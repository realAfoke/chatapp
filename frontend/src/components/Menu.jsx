import menuIcon from "../assets/icons/menu2.svg";
import profileIcon from "../assets/icons/profileIcon.svg"
import { useAuth } from "../routes/context";
import { useNavigate } from "react-router-dom";
export default function Menu() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  return (
    <div className=" bg-[#336333] font-serif text-white text-4xl p-3 py-4 flex justify-between">
      <div>     Qill </div>
      <div>
        <img src={profileIcon} className="w-10 h-10 rounded-full" onClick={() => {
          if (isAuthenticated) {
            navigate('/profile')
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
