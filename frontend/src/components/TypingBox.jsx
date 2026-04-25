import { httpSend, wssSend } from "../utils/chatUtil";
import attachmentIcon from "../assets/icons/attachment-icon.svg";
import sendButton from "../assets/icons/send-button.svg";
import { useLocation } from "react-router-dom";

export function TypingComponent({
  handleAttachment,
  handleUserContent,
  userContent,
  socketChat,
}) {
  const location = useLocation();
  const conversationId = location.pathname.split("/").filter((p) => p != "")[2];

  return (
    <div
      className={`${userContent.preview ? "py-4" : ""} flex justify-between items-center my-2 gap-2 relative`}
    >
      <span className="">
        <img
          src={attachmentIcon}
          className={`${userContent.preview ? "hidden" : "block"} w-8 h-8`}
          alt=""
          onClick={() => handleAttachment((prev) => !prev)}
        />
      </span>
      <input
        type="text"
        name="typingBox"
        value={userContent.content}
        onChange={(e) => {
          handleUserContent((prev) => ({
            ...prev,
            content: e.target.value,
            // msgId: message[message.length - 1]?.id || 0,
            isTyping: true,
          }));
        }}
        onBlur={() =>
          handleUserContent((prev) => ({
            ...prev,
            isTyping: false,
            content: prev.content,
          }))
        }
        id="typingBox"
        className={`${userContent.preview ? "text-white ring-white" : "text-black ring-black"} rounded-[10px] p-3 min-h-[50px] outline-none flex-2 h-10 ring`}
      />
      <button
        onClick={async () => {
          if (userContent.preview) {
            await httpSend(
              userContent,
              conversationId,
              handleUserContent,
              socketChat,
            );
          } else {
            await wssSend({
              ref: socketChat,
              userContent: userContent,
              setUserContent: handleUserContent,
            });
          }
        }}
      >
        <img src={sendButton} className="w-10 h-10" alt="" />
      </button>
    </div>
  );
}
