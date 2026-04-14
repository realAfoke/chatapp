import { api, generateRandomColors } from "../utils";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import AttachmentBox from "../components/AttachmentBox";
import Preview from "../components/Preview";
import TickIcon from "../assets/icons/tick.svg?react";
import { formatDate, touchStart, touchEnd } from "../utils/chatUtil";
import { TypingComponent } from "../components/TypingBox";
import { useChatHooks, closeMemoryLeaks } from "../hooks/chatHook";
import ReactionUi from "../components/ReactionUi";
import TypingIdicator from "../components/TypingIndicator";
import goBack from "../assets/icons/go-back.svg";

export default function Chat() {
  const {
    userStatus,
    conversationObj,
    setConversationObj,
    miniProfile,
    messages,
    setMessages,
    setChatId,
    socketChat,
    connections,
    setConnections,
  } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const newConvo = location?.state?.newConvo ?? {};
  // debugger;
  // console.log("messages", messages);
  const conversationId = location.pathname.split("/").filter((p) => p != "")[2];

  const { conversations } = conversationObj;
  useEffect(() => {
    if (Number(conversationId) in conversations) return;
    setConversationObj((prev) => {
      const { conversations, ordering } = prev;
      const activeChat = conversations[conversationId];
      return {
        ...prev,
        conversations: {
          ...conversations,
          [conversationId]: {
            ...(activeChat ?? {}),
            ...newConvo,
            messages: [...(activeChat?.messages ?? [])],
            lastMssg: { ...(activeChat?.lastMssg ?? {}), ...newConvo.lastMssg },
          },
        },
        ordering: [...new Set([Number(conversationId), ...ordering])],
      };
    });
  });
  const conversation = conversations[Number(conversationId)] ?? newConvo;
  const connectionRequest = conversation?.connectionRequest;

  // console.log("conversation:", conversation);
  const typing = conversation?.typing;
  const currentUserId = miniProfile.id;
  const conversationMessages =
    conversation?.messages.map((mssgId) => messages[mssgId]) ?? [];
  // debugger;
  const connectionIds = new Set(connections.map((con) => con.id));
  const [attachment, setAttachment] = useState(false);
  const otherUser = conversation?.allParticipants.filter(
    (user) => user.id !== miniProfile.id,
  )[0];
  const isConnected = !connectionIds.has(otherUser?.id);
  const isRequestd = currentUserId !== connectionRequest?.fromUserInfo?.id;
  const connectionStatus = connectionRequest?.status === "pending";
  // debugger;
  const bottomRef = useRef(null);
  const [userContent, setUserContent] = useState({
    msgId: "",
    userId: "",
    type: null,
    isTyping: null,
    content: " ",
    preview: null,
  });
  const [presser, setPresser] = useState(null);
  const [showReactionUi, setShowReactionUi] = useState({
    state: false,
    obj: "",
    event: "",
  });
  const textScreen = useRef(null);
  useChatHooks(
    conversation,
    conversationId,
    setChatId,
    currentUserId,
    messages,
    setMessages,
    userStatus,
    userContent,
    setUserContent,
    bottomRef,
    socketChat,
    otherUser,
  );
  closeMemoryLeaks(userContent);
  const bgColor = generateRandomColors();
  return (
    <div className="h-screen overflow-y-auto flex flex-col">
      <div className="flex items-center bg-[#336333] gap-2 shadow-sm py-3 px-2">
        <img
          src={goBack}
          className="w-7 h-7"
          alt=""
          onClick={() => {
            navigate("../");
          }}
        />

        <div>
          {otherUser.profilePicture ? (
            <img
              src={`${conversation.chatType === "group" ? conversation.groupImg : otherUser.profilePicture}`}
              className={`w-12 h-12 rounded-full `}
              style={{ background: bgColor }}
              alt=""
            />
          ) : (
            <div
              className="w-13 h-13  flex justify-center font-bold text-[25px] items-center rounded-full "
              style={{ background: bgColor }}
            >
              <p>{`${otherUser.username[0].toUpperCase()}${otherUser.username[1].toUpperCase()}`}</p>
            </div>
          )}
        </div>
        <div>
          <div className="text-white">{otherUser?.username}</div>
          <div className="text-white">
            {userStatus.includes(otherUser?.id)
              ? "online"
              : formatDate(otherUser?.lastSeen)}
          </div>
        </div>
      </div>
      <div className="h-[calc(100%-15%)] overflow-y-auto" ref={textScreen}>
        {showReactionUi?.state && (
          <ReactionUi
            message={showReactionUi?.obj}
            event={showReactionUi?.event}
            setShowReactionUi={setShowReactionUi}
            socketChat={socketChat}
            // conversationId={conversationId[2]}
          />
        )}
        <ul className="list-none gap-3 flex flex-col p-3">
          <div className="text-md text-green-600 text-center flex flex-col items-center gap-3 my-4 mb-8">
            <div>
              <p>New chat started.</p>
              <p>Send a message to keep the chat going</p>
            </div>
            {isRequestd && isConnected && connectionStatus && (
              <div className="flex flex-col gap-2 px-6 items-center">
                <p>
                  This person is not in your connection list,what would you want
                  to do?
                </p>
                <div className="flex justify-between *:outline-0 *:rounded-sm *:p-2 *:border-0  *:w-40 gap-5 *:text-white m-2 mb-3">
                  <button className="bg-red-700">Block</button>
                  <button
                    className="bg-green-600"
                    onClick={async () => {
                      try {
                        const acceptConnection = await api.patch(
                          `api/connection/request/${connectionRequest?.id}/`,
                          { status: "connected" },
                        );
                        // console.log(acceptConnection.data);
                        // debugger;
                        setConnections((prev) => {
                          return [...prev, acceptConnection.data?.fromUserInfo];
                        });
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                  >
                    Accept
                  </button>
                </div>
              </div>
            )}
          </div>
          {conversationMessages?.map((message) => {
            const messagePosition =
              currentUserId === message?.sender ? "end" : "start";
            message.align = messagePosition;

            const status = message.readStatus?.[otherUser?.id];
            const hasReaction = Object.keys(message?.readStatus || {}).includes(
              String(otherUser?.id),
            );
            const reactedReactions = message?.reaction?.map((reaction, i) => {
              return (
                <li
                  key={i}
                  className="w-2 h-2 flex justify-center items-center"
                >
                  {reaction}
                </li>
              );
            });
            return (
              <li
                key={message?.id}
                className={`max-w-80 max-h-200 flex flex-col items-center ${message?.sender === currentUserId ? "self-end " : "self-start"}`}
                onTouchStart={(e) =>
                  touchStart(e, setPresser, setShowReactionUi, message)
                }
                onTouchEnd={touchEnd}
              >
                <div
                  className={`${message?.sender == otherUser?.id ? "rounded-xl rounded-bl-xs bg-[rgba(0,0,0,0.7)]" : "rounded-xl rounded-br-xs bg-[#336333]"} p-2`}
                >
                  <div className="flex max-h-500">
                    {message?.image ? (
                      <img
                        src={message?.image}
                        className="max-h-80 w-full"
                        onLoad={() =>
                          bottomRef.current?.scrollIntoView({
                            behavior: "smooth",
                          })
                        }
                      />
                    ) : message?.video ? (
                      <video
                        src={message?.video}
                        controls
                        onLoadedData={() =>
                          bottomRef.current?.scrollIntoView({
                            behavior: "smooth",
                          })
                        }
                      />
                    ) : message?.audio ? (
                      <audio src={message?.audio} controls />
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="flex justify-between">
                    <p className="text-white leading-5 text-[16px] flex items-center">
                      {message?.content}
                    </p>
                    {message.sender == currentUserId && (
                      <p className="relative flex ml-1 self-end">
                        {
                          // status === "Read" ||
                          // status === "Delivered" ||
                          userStatus.includes(otherUser?.id) && (
                            <TickIcon
                              className={`absolute -top-0.5 right-0.5 self-end ${status === "Read" && hasReaction ? "text-[#bcbcf1]" : "text-gray-500"}  w-4 block`}
                            />
                          )
                        }

                        <TickIcon
                          className={`self-end text-[#bcbcf1] w-5 ${status === "Read" ? "text-[#bcbcf1]" : "text-gray-500"} `}
                        />
                      </p>
                    )}
                  </div>
                </div>
                {message?.reaction?.length > 0 && (
                  <ul
                    className={`bg-[rgba(0,0,0,0.7)] border-2 border-black rounded-full  p-2  ${currentUserId === message?.sender ? "self-end " : "self-start"}`}
                  >
                    {reactedReactions}
                  </ul>
                )}
              </li>
            );
          })}

          <div
            ref={bottomRef}
            className={` gap-1 ${
              typing?.isTyping && typing?.whoIsTyping === currentUserId
                ? "flex"
                : "invisible"
            }`}
          >
            <TypingIdicator />
          </div>
        </ul>
      </div>
      <TypingComponent
        handleAttachment={setAttachment}
        handleUserContent={setUserContent}
        userContent={userContent}
        setMessages={setMessages}
        socketChat={socketChat}
      />
      {attachment && <AttachmentBox setUserContent={setUserContent} />}

      <Preview
        handleAttachment={setAttachment}
        handleUserContent={setUserContent}
        userContent={userContent}
        message={conversationMessages}
        setMessages={setMessages}
        conversationId={conversationId[2]}
        socketChat={socketChat}
      />
    </div>
  );
}
