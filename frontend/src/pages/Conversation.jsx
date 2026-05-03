import { api } from "../utils";
import { Outlet, redirect } from "react-router-dom";
import Menu from "../components/Menu";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import TypingIdicator from "../components/TypingIndicator";
import AddUserIcon from "../assets/icons/add-user.svg";
import AddNewChat from "../components/AddNewChat";
import { generateRandomColors } from "../utils";
import { useAuth } from "../routes/context";
import { useLoaderData } from "react-router-dom";
import { normalise } from "../utils/chatUtil";
import { useParams, useLocation } from "react-router-dom";
import { getDb } from "../utils";
import { useConversation } from "../hooks/conversationHook";


export default function ConversationsLayOut() {
  const appData = useLoaderData();
  let [indexedDB, setIndexedDB] = useState(null)
  const { chatId } = useParams()
  const [showProfile, setShowProfile] = useState(false)
  const { conversationMessages, fullConversation } = useMemo(() => normalise(appData[0]), [appData]);
  const { user, userConversations, setUserConversations, setMessages, typing, connections, token, setUserStatus, userStatusRef, setCurrentChat, setTyping, chatWs } = useAuth()
  const [localMessage, setLocalMessage] = useState([])

  useEffect(() => {
    setUserConversations((prev) => ({ ...prev, ...fullConversation }))
  }, [fullConversation])

  useEffect(() => {
    (async () => {
      const db = await getDb()
      setIndexedDB(db)
    })()
  }, [])

  useEffect(() => {
    setMessages((prev) => ({ ...prev, ...conversationMessages }))
  }, [conversationMessages])

  const [hideAddNewChat, setHideAddNewChat] = useState(true);
  // useConversationHooke(user, token, setUserConversations, setMessages, setUserStatus, userStatusRef, generalSocket)

  useConversation(user, setMessages, setUserConversations, chatId, token, chatWs, indexedDB, setLocalMessage)

  const conversations = userConversations.ordering?.map((convoId) => {
    const mainConversation = userConversations.conversations?.[convoId]
    const otherUser = mainConversation.allParticipants?.filter((secondUser) => secondUser.id !== user?.id)[0]
    return (
      <li key={mainConversation?.id}>
        <Convo conversation={mainConversation} user={user} otherUser={otherUser} setCurrentChat={setCurrentChat} />
      </li>
    )
  })
  return (
    <div className="relative flex overflow-hidden h-screen flex-col md:flex-row lg:flex-row gap-1">
      <div className={` ${chatId || showProfile ? 'hidden md:flex md:flex-col lg:flex' : 'flex flex-col'}`}>
        <Menu handleProfile={setShowProfile} />
        <div className="p-2">
          <input
            type="search"
            name=""
            id=""
            className="text-xs md:text-sm lg:text-sm outline-0 flex px-3 py-2 my-2 ring-1 ring-green-500 rounded-[25px] w-full"
            placeholder="search conversation, sorry but it's now working yet"
          />
        </div>
        <ul className="px-2 flex-1 overflow-auto">
          {hideAddNewChat ? (
            <>
              <div className="">
                <ul className="flex flex-col">
                  {conversations}
                </ul>
              </div>
              <div className=" w-14 h-14 md:w-16 md:h-16 lg:w-16 lg:h-16 bg-[#336333] p-4 rounded-sm absolute bottom-30 left-80 lg:left-70 lg:bottom-20">
                <img
                  src={AddUserIcon}
                  onClick={() => setHideAddNewChat((prev) => !prev)}
                  className="w-full"
                  alt=""
                />
              </div>
            </>
          ) : (
            <AddNewChat
              connections={connections}
              setHideAddNewChat={setHideAddNewChat}
            />
          )}
        </ul>
      </div>
      <div className="flex-1">
        <Outlet context={{ setHideAddNewChat, chatId, indexedDB }} />
      </div>
    </div >
  )
}


export function Convo({ conversation, otherUser }) {
  const lastMssg = conversation.lastMssg;
  const mssgTime = (timestamp) => {
    const mssgDate = new Date(timestamp);
    const now = new Date();
    const diff = now - mssgDate;
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) {
      return mssgDate.toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (hours < 48) {
      return "yesterday";
    } else {
      return mssgDate.toLocaleDateString();
    }
  };
  const bgColor = generateRandomColors();
  return (
    <Link
      to={`chat/${conversation?.id}`} replace

      className="flex items-center gap-2 my-5"
    >
      {otherUser?.profilePicture ? (
        <img
          src={`${conversation.chatType === "group" ? conversation.groupImg : otherUser?.profilePicture}`}
          className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full `}
          style={{ background: bgColor }}
          alt=""
        />
      ) : (
        <div
          className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex justify-center font-bold text-xs md:text-sm lg:text-base items-center rounded-full "
          style={{ background: bgColor }}
        >
          <p className="text-xs md:text-sm lg:text-base">{`${otherUser.username[0].toUpperCase()}${otherUser.username[1].toUpperCase()}`}</p>
        </div>
      )}

      <div className="flex-1 flex justify-between mt-2">
        <div className="">
          <p className="font-medium text-xs md:text-sm lg:text-base ">
            {conversation.name ? conversation.name : otherUser.username}
          </p>
          {conversation?.typing?.isTyping ? (
            <TypingIdicator />
          ) : (
            <p className="text-gray-500 truncate w-60 text-xs md:text-sm lg:text-sm">{conversation.lastInteraction === 'text' ? conversation?.lastMsg : conversation?.recentReaction}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`bg-green-500 text-white rounded-full  text-xs md:text-sm lg:text-base px-3 py-1 ${conversation.unreadMssgCount === 0 ? "hidden" : "block"}`}
          >
            {conversation.unreadMssgCount}
          </span>

          <span className="text-green-500  text-xs md:text-sm lg:text-sm ">
            {lastMssg?.timestamp ? mssgTime(lastMssg?.timestamp) : ""}{" "}
          </span>
        </div>
      </div>
    </Link>
  );
}
export async function loader() {
  try {
    const conversation = api.get("api/conversations/");
    const connections = api.get("api/connection/connects/");
    const responses = await Promise.allSettled([
      conversation,
      connections,
    ]);
    const mainResponse = [];
    for (const respons of responses) {
      if (respons.status === "fulfilled") {
        mainResponse.push(respons.value.data);
      }
    }
    return mainResponse;
  } catch (error) {
    console.log('got here')
    console.error(error);
    return redirect('/login')
  }
}

