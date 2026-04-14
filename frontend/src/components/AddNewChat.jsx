import SingleChatIcon from "../assets/icons/add2.svg";
import GroupChatIcon from "../assets/icons/add-user.svg";
import { useEffect, useState, useRef } from "react";
import SearchIcon from "../assets/icons/search2.svg";
import { api } from "../utils";
import { useNavigate } from "react-router-dom";
import goBack from "../assets/icons/go-back.svg";

export default function AddNewChat({ connections, setHideAddNewChat }) {
  const navigate = useNavigate();
  const [showSearchInput, setShowSearchInput] = useState(false);
  const debouncer = useRef(null);
  const [searchResult, setSearchResult] = useState([]);
  const [searchUser, setSearchUser] = useState("");

  useEffect(() => {
    if (!searchUser) {
      setSearchResult([]);
      return;
    }
    async function findUsers() {
      try {
        console.log(searchUser);
        const results = await api.get("api/find-users/", {
          params: { searchParam: searchUser },
        });

        setSearchResult((prev) => {
          const oldIds = new Set(prev.map((u) => u.id));
          const search = results.data.filter(
            (result) => !oldIds.has(result.id),
          );
          return [...prev, ...search];
        });
      } catch (error) {
        console.error(error);
      }
    }
    if (debouncer.current) clearTimeout(debouncer.current);
    debouncer.current = setTimeout(async () => {
      await findUsers();
    }, 300);
  }, [searchUser]);

  async function createNewConversation(user) {
    try {
      const startNewConversation = await api.post("api/conversation/create/", {
        pending_user: [user.id],
      });
      const newConvo = startNewConversation.data;
      const { id } = newConvo;
      navigate(`chat/${id}`, { state: { newConvo: newConvo } });
    } catch (error) {
      console.error(error);
    }
  }
  const foundUsers = searchResult?.map((user) => {
    return (
      <li
        key={user.id}
        className="flex items-center gap-3 py-4"
        onClick={async () => {
          await createNewConversation(user);
        }}
      >
        <img
          src={user.profilePicture}
          className="w-12 h-12 rounded-full"
          alt=""
        />
        <div className="">
          <div className="text-white text-[18px] font-semibold">
            {user.username}
          </div>
          <span className="text-gray-500 text-[15px] flex -mt-1.5">
            {user?.bio}
          </span>
        </div>
      </li>
    );
  });
  const alreadyAcceptedConnections = connections.map((connection) => {
    function generateRandomColors() {
      const r = Math.floor(Math.random() * 156 + 100);
      const g = Math.floor(Math.random() * 256) + 100;
      const b = Math.floor(Math.random() * 156 + 100);
      return `rgb(${r},${g},${b})`;
    }
    const bgColor = generateRandomColors();
    return (
      <li key={connection.id} className="flex items-center gap-2">
        {connection.profilePicture ? (
          <img
            src={connection.profilePicture}
            className={`w-15 h-15 rounded-full `}
            style={{ background: bgColor }}
            alt=""
          />
        ) : (
          <div
            className="w-15 h-15  flex justify-center font-bold text-[25px] items-center rounded-full "
            style={{ background: bgColor }}
          >
            <p>{`${connection.username[0].toUpperCase()}${connection.username[1].toUpperCase()}`}</p>
          </div>
        )}

        <div>
          <div className="text-[18px] text-white">{connection.username}</div>
        </div>
      </li>
    );
  });
  return (
    <div className="fixed h-screen w-full bg-[#222121] top-0 left-0 px-2">
      <header className={`justify-between py-2 items-center flex gap-4`}>
        <div className="flex items-center">
          <img
            src={goBack}
            className="w-7 h-7"
            alt=""
            onClick={() => {
              if (showSearchInput) {
                setShowSearchInput((prev) => !prev);
              } else {
                setHideAddNewChat((prev) => !prev);
              }
            }}
          />
          {!showSearchInput && (
            <div className="text-white text-xl px-2 py-5 font-semibold tracking-tight">
              Start New Chat
            </div>
          )}
        </div>

        <div className="relative flex flex-1 ">
          <input
            type="text"
            className={`block w-full rounded-md p-3 py-3.5 bg-gray-700 origin-right transition-transform duration-100 ease-in-out ${showSearchInput ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"} text-white outline-0`}
            name=""
            value={searchUser}
            placeholder="Search for your friends here ..."
            id=""
            autoFocus
            onChange={(e) => setSearchUser(e.target.value)}
          />

          <img
            src={SearchIcon}
            className="max-w-10 max-h-10 absolute right-2 top-1 z-9999"
            alt=""
            onClick={() => setShowSearchInput(true)}
          />
        </div>
      </header>
      <div>
        {searchResult.length >= 1 ? (
          <ul className="flex flex-col gap-2 mt-2">{foundUsers}</ul>
        ) : (
          <div className="mt-8">
            <ul className="p-2 flex flex-col gap-8">
              <li className="flex items-center gap-2">
                <div className="w-12 h-12 p-3 rounded-full bg-[#336333]">
                  <img src={GroupChatIcon} className="max-w-full" alt="" />
                </div>
                <span className="text-[19px] font-semibold text-white">
                  New Group
                </span>
              </li>
            </ul>
            <div className="my-8 px-3 flex flex-col gap-6">
              <div className="text-white font-semibold text-[19px]">
                Connections
              </div>
              <ul className="flex flex-col gap-6">
                {alreadyAcceptedConnections}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function addNewChatLoader() {
  try {
    const connections = await api.get("connection/connects/");
    return connections.data;
  } catch (error) {
    console.error(error.data);
  }
}
