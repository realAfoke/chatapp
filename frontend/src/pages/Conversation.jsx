import { Outlet } from "react-router-dom";
import Menu from "../components/Menu";
import { Link } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import TypingIdicator from "../components/TypingIndicator";
import AddUserIcon from "../assets/icons/add-user.svg";
import AddNewChat from "../components/AddNewChat";
import { generateRandomColors } from "../utils";

export default function ConversationListComponent() {
  const {
    conversationObj,
    setConversationObj,
    miniProfile,
    setChatId,
    typing,
    connections,
    setConnections,
    setMessages,
  } = useOutletContext();
  // console.log(conversationObj);
  const [hideAddNewChat, setHideAddNewChat] = useState(true);
  useEffect(() => {
    setChatId(null);
  });
  return (
    <div className="relative">
      <div>
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
              <Conversation
                conversationObj={conversationObj}
                typing={typing}
                miniProfile={miniProfile}
              />
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
      <Outlet />
    </div>
  );
}

export function Conversation({ conversationObj, miniProfile }) {
  // console.log(conversationObj);
  const { conversations, ordering } = conversationObj;
  const conversationList = ordering.map((conversationId) => {
    const conversation = conversations[conversationId];
    const otherUser = conversation.allParticipants.filter(
      (user) => user.id !== miniProfile.id,
    )[0];
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
        to={`chat/${conversation.id}`}
        className="flex items-center gap-2 my-5"
        key={conversation.id}
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
  });
  return <div>{conversationList}</div>;
}
