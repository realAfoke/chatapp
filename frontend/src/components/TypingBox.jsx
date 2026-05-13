import { httpSend, wssSend } from "../utils/chatUtil";
import attachmentIcon from "../assets/icons/attachment-icon.svg";
import sendButton from "../assets/icons/send-button.svg";
import { useAuth } from "../routes/context";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function TypingComponent({
  handleAttachment,
  handleOutGoingMessage,
  outGoingMessage,
}) {
  const navigate = useNavigate()
  const { chatWs, user, userConversations, setUserConversations, setMessages } = useAuth()
  const { chatId } = useParams()
  const allConversation = userConversations?.conversations ?? {}
  const conversation = allConversation?.[chatId] ?? {}

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
        className={`text-black ring-black rounded-[10px] p-3 outline-none flex-2 h-10 ring`}
      />
      <button
        onClick={async () => {
          const content = { ...outGoingMessage }
          content.clientId = crypto.randomUUID()
          content.createdAt = Date.now()
          content.status = 'pending'
          content.sender = user?.id

          if (outGoingMessage.preview || conversation?.messages?.length < 1) {
            if (conversation?.messages?.length < 1) {
              content['isNewChat'] = true
            }
            await httpSend(
              content,
              handleOutGoingMessage,
              setMessages,
              setUserConversations,
              chatId,
              navigate
            );
          } else {

            content.conversation = chatId
            await wssSend({
              ref: chatWs,
              content: content,
              setOutGoingMessage: handleOutGoingMessage,
              setMessages: setMessages,
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
