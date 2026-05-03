import { api, generateRandomColors } from "../utils";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import AttachmentBox from "../components/AttachmentBox";
import Preview from "../components/Preview";
import TickIcon from "../assets/icons/tick.svg?react";
import { formatDate, touchStart, touchEnd } from "../utils/chatUtil";
import { TypingComponent } from "../components/TypingBox";
import { closeMemoryLeaks } from "../hooks/chatHook";
import ReactionUi from "../components/ReactionUi";
import TypingIdicator from "../components/TypingIndicator";
import goBack from "../assets/icons/go-back.svg";
import { useAuth } from "../routes/context";
import image from "../assets/images/file1.jpg"
import { useChat } from "../hooks/chatHook";


export default function Chat() {
  const { setHideAddNewChat, chatId, indexedDB
  } = useOutletContext()
  const { user, userConversations, setUserConversations, messages, setMessages, connections, setConnections, userStatus, chatWs } = useAuth()
  const location = useLocation();

  const navigate = useNavigate();
  const newConvo = location?.state?.newConvo ?? {};


  const { conversations } = userConversations;
  useEffect(() => {
    if (conversations?.[chatId]) return;
    setUserConversations((prev) => {
      const { conversations, ordering } = prev;
      const activeChat = conversations?.[chatId];
      return {
        ...prev,
        conversations: {
          ...conversations,
          [chatId]: {
            ...(activeChat ?? {}),
            ...newConvo,
            messages: [...(activeChat?.messages ?? [])],
            lastMssg: { ...(activeChat?.lastMssg ?? {}), ...newConvo.lastMssg },
          },
        },
        ordering: [...new Set([Number(chatId), ...ordering ?? []])],
      };
    });
  });
  const [presser, setPresser] = useState(false)
  const conversation = conversations?.[chatId] ?? newConvo;
  const connectionRequest = conversation?.connectionRequest;

  const typing = conversation?.typing;
  const currentUserId = user?.id;
  const conversationMessages =
    conversation?.messages?.map((mssgId) => messages[mssgId]) ?? [];
  const connectionIds = new Set(connections.map((con) => con.id));
  const [attachment, setAttachment] = useState(false);
  const otherUser = conversation?.allParticipants?.filter(
    (participant) => participant.id !== user.id,
  )[0];
  const isConnected = !connectionIds.has(otherUser?.id);
  const isRequestd = currentUserId !== connectionRequest?.fromUserInfo?.id;
  const connectionStatus = connectionRequest?.status === "pending";
  // debugger;
  const bottomRef = useRef(null);
  const [outGoingMessage, setOutGoingMessage] = useState({
    receiverId: null,
    sender: null,
    conversation: chatId,
    // type: null,
    // isTyping: null,
    text: "",
    // preview: null,
  });

  const [showReactionUi, setShowReactionUi] = useState({
    state: false,
    obj: "",
    event: "",
  });

  useChat(user, otherUser, conversationMessages, setMessages, conversation, setUserConversations, outGoingMessage, setOutGoingMessage, chatWs, chatId, otherUser?.id, bottomRef, indexedDB)

  closeMemoryLeaks(outGoingMessage);
  const bgColor = generateRandomColors();


  return (
    <div className="h-screen flex flex-col overflow-hidden">

      <div className="flex items-center bg-[#336333] gap-2 shadow-sm py-3 px-2">
        <img
          src={goBack}
          className="w-4 h-4 md:w-5 md:-h-5 lg:w-5 lg:h-5"
          alt=""
          onClick={() => {
            setHideAddNewChat(true)
            navigate("/conversations");
          }}
        />

        <div>
          {otherUser?.profilePicture ? (
            <img
              src={`${conversation?.chatType === "group" ? conversation?.groupImg : otherUser?.profilePicture}`}
              className={` w-8 h-8 md:w-10 md:h-10 lg:w-10 lg:h-10 rounded-full `}
              style={{ background: bgColor }}
              alt=""
            />
          ) : (
            <div
              className="  w-8 h-8 md:w-10 md:h-10 lg:w-10 lg:h-10 flex justify-center font-bold text-base md:text-lg lg:text-xl items-center rounded-full "
              style={{ background: bgColor }}
            >
              <p>{`${otherUser?.username[0]?.toUpperCase()}${otherUser?.username[1]?.toUpperCase()}`}</p>
            </div>
          )}
        </div>
        <div>
          <div className="text-white text-xs md:text-sm lg:text-base">{otherUser?.username}</div>
          <div className="text-white text-xs">
            {userStatus.includes(otherUser?.id)
              ? "online"
              : formatDate(otherUser?.lastSeen)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col">
        {showReactionUi?.state && (
          <ReactionUi
            message={showReactionUi?.obj}
            receiverId={outGoingMessage.receiverId}
            event={showReactionUi?.event}
            setShowReactionUi={setShowReactionUi}
          // chatId={conversationId[2]}
          />
        )}
        <ul className="list-none gap-3 flex flex-col p-3 ">
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
            if (message) {
              message.align = messagePosition;
            }
            const isRead = message?.id <= conversation?.lastReadMsgId && message?.sender === user?.id

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
                key={message?.id ?? message?.clientId}
                className={`max-w-80 max-h-200 flex flex-col items-center ${message?.sender === currentUserId ? "self-end " : "self-start"} relative`}
                onTouchStart={(e) =>
                  touchStart(e, setPresser, setShowReactionUi, message)
                }
                onTouchEnd={touchEnd}
              >
                <div
                  className={`${message?.sender == otherUser?.id ? "rounded-xl rounded-bl-xs bg-[rgba(0,0,0,0.7)]" : "rounded-xl rounded-br-xs bg-[#336333]"} p-1`}
                >
                  <div className="flex max-h-500">
                    {message?.attachmentType?.includes('image') ? (
                      <img
                        src={message?.attachment}
                        className="max-h-80 w-full"

                      />
                    ) : message?.attachmentType?.includes('video') ? (
                      <video
                        src={message?.attachment}
                        controls

                      />
                    ) : message?.attachmentType?.includes('audio') ? (
                      <audio src={message?.attachment} controls />
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="flex justify-between">
                    {message?.text?.length > 1 && <p className="text-white leading-5 text-sm md:text-sm lg:text-sm flex items-center p-1">
                      {message?.text}
                    </p>}
                    {message.sender == currentUserId && (
                      <p className="absolute  flex ml-1 self-end bottom-1 right-0">
                        {
                          // status === "Read" ||
                          // status === "Delivered" ||
                          (message.status?.toLowerCase() === 'delivered' || isRead) && (
                            <TickIcon
                              className={`absolute -top-0.5 right-0.5 self-end ${isRead ? "text-[#bcbcf1]" : "text-gray-500"}  w-4 block`}
                            />
                          )
                        }

                        <TickIcon
                          className={`self-end text-[#bcbcf1] w-3 ${isRead ? "text-[#bcbcf1]" : "text-gray-500"} `}
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
          <li className="  relative h-50 w-50 border-5 border-red-500">
            <img src={image} className="h-full" />
            <div className=" backdrop-blur-xs bg-[rgba(0,0,0,0.2)] absolute top-0 h-full w-full flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-4 border-black border-t-transparent animate-spin"></div>
                <div className="absolute top-2 left-2 text-xm">rss</div>
              </div>
            </div>
          </li>
          <div
            ref={bottomRef}
            className={` gap-1 ${typing ? "flex"
              : "invisible"
              }`}
          >
            <TypingIdicator />
          </div>
        </ul>

      </div>



      <TypingComponent
        handleAttachment={setAttachment}
        handleOutGoingMessage={setOutGoingMessage}
        outGoingMessage={outGoingMessage}
        setMessages={setMessages}
        conversation={conversation}
        setUserConversations={setUserConversations}
      />
      {attachment && <AttachmentBox setOutGoingMessage={setOutGoingMessage()} />}

      <Preview
        handleAttachment={setAttachment}
        handleOutGoingMessage={setOutGoingMessage}
        outGoingMessage={outGoingMessage}
        message={conversationMessages}
        setMessages={setMessages}
        chatId={chatId}
        conversation={conversation}
        setUserConversations={setUserConversations}

      />
    </div >
  );
}
