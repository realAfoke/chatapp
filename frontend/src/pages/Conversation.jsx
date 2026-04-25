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
import { useConversationHooke } from "../hooks/conversationHooks";
import { useParams } from "react-router-dom";

export default function ConversationsLayOut() {
  const appData = useLoaderData();
  const { chatId } = useParams()
  const { conversationMessages, fullConversation } = useMemo(() => normalise(appData[0]), [appData]);
  const { user, userConversations, setUserConversations, setMessages, setChatId, typing, connections, token, setUserStatus, userStatusRef, setCurrentChat, setTyping } = useAuth()
  const generalSocket = useRef(null);

  useEffect(() => {
    setUserConversations((prev) => ({ ...prev, ...fullConversation }))
  }, [fullConversation])


  useEffect(() => {
    setMessages((prev) => ({ ...prev, ...conversationMessages }))
  }, [conversationMessages])

  const [hideAddNewChat, setHideAddNewChat] = useState(true);
  useConversationHooke(user, token, setUserConversations, setMessages, setUserStatus, userStatusRef, generalSocket)

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
    <div className="relativ">
      <div className={`${chatId ? 'hidden md:block' : 'block'} flex flex-col h-screen`}>

        <Menu />
        <div className="p-2">
          <input
            type="search"
            name=""
            id=""
            className="outline-0 flex px-5 py-4 my-2 ring-1 ring-green-500 rounded-[25px] w-full"
            placeholder="search conversation, sorry but it's now working yet"
          />
        </div>
        <ul className="px-2">
          {hideAddNewChat ? (
            <>
              <div className="flex-1 h-screen overflow-auto">
                <ul className="flex flex-col gap-3">
                  {conversations}
                </ul>
              </div>
              <div className="h-20 w-20 bg-[#336333] p-4 rounded-sm fixed bottom-20 right-5">
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
      <Outlet context={{ generalSocket, setHideAddNewChat }} />
    </div >
  );
}

export function Convo({ conversation, otherUser, setCurrentChat }) {
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
      to={`chat/${conversation?.id}`}

      className="flex items-center gap-2 my-5"
    >
      {otherUser.profilePicture ? (
        <img
          src={`${conversation.chatType === "group" ? conversation.groupImg : otherUser.profilePicture}`}
          className={`w-15 h-15 rounded-full `}
          style={{ background: bgColor }}
          alt=""
        />
      ) : (
        <div
          className="w-15 h-15  flex justify-center font-bold text-[25px] items-center rounded-full "
          style={{ background: bgColor }}
        >
          <p>{`${otherUser.username[0].toUpperCase()}${otherUser.username[1].toUpperCase()}`}</p>
        </div>
      )}

      <div className="flex-1 flex justify-between mt-2">
        <div className="">
          <p className="font-medium text-lg ">
            {conversation.name ? conversation.name : otherUser.username}
          </p>
          {conversation?.typing?.isTyping ? (
            <TypingIdicator />
          ) : (
            <p className="text-gray-500 truncate w-60">{lastMssg?.content}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`bg-green-500 text-white rounded-full px-3 py-1 ${conversation.unreadMssgCount === 0 ? "hidden" : "block"}`}
          >
            {conversation.unreadMssgCount}
          </span>

          <span className="text-green-500">
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
