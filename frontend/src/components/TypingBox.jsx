import { httpSend, wssSend } from "../utils/chatUtil";
import attachmentIcon from "../assets/icons/attachment-icon.svg";
import sendButton from "../assets/icons/send-button.svg";
import { useLocation } from "react-router-dom";
import { useAuth } from "../routes/context";

export function TypingComponent({
  handleAttachment,
  handleOutGoingMessage,
  outGoingMessage,
  setMessages,
  conversation,
  setUserConversations,
}) {
  const location = useLocation();
  const { chatWs } = useAuth()
  const conversationId = location.pathname.split("/").filter((p) => p != "")[2];

  return (
    <div
      className={`${outGoingMessage.preview ? "py-4" : ""} flex justify-between items-center my-2 gap-2 relative`}
    >
      <span className="">
        <img
          src={attachmentIcon}
          className={`${outGoingMessage.preview ? "hidden" : "block"} w-8 h-8`}
          alt=""
          onClick={() => handleAttachment((prev) => !prev)}
        />
      </span>
      <input
        type="text"
        name="typingBox"
        value={outGoingMessage.text}
        onChange={(e) => {
          handleOutGoingMessage((prev) => ({
            ...prev,
            text: e.target.value,
            // msgId: message[message.length - 1]?.id || 0,
            // isTyping: true,
          }));
        }}
        onBlur={() =>
          handleOutGoingMessage((prev) => ({
            ...prev,
            // isTyping: false,
            text: prev.text,
          }))
        }
        id="typingBox"
        className={`${outGoingMessage.preview ? "text-white ring-white" : "text-black ring-black"} rounded-[10px] p-3 outline-none flex-2 h-10 ring`}
      />
      <button
        onClick={async () => {
          if (outGoingMessage.preview) {
            await httpSend(
              outGoingMessage,
              conversationId,
              handleOutGoingMessage,
              wss,
            );
          } else {

            console.log('clicked!!!')
            const content = { ...outGoingMessage }
            content.clientId = crypto.randomUUID()
            content.createdAt = Date.now()
            content.status = 'pending'
            await wssSend({
              ref: chatWs,
              content: content,
              setOutGoingMessage: handleOutGoingMessage,
              setMessages: setMessages,
              conversation: conversation,
              setConversation: setUserConversations
            });
          }
        }}
      >
        <img src={sendButton} className="w-10 h-10" alt="" />
      </button>
    </div>
  );
}
