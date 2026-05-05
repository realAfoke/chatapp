import { TypingComponent } from "./TypingBox";
import close from "../assets/icons/close.svg";
export default function Preview({
  handleAttachment,
  handleOutGoingMessage,
  outGoingMessage,
  setMessages,
  setUserConversations
}) {
  return (
    <div
      className={`${outGoingMessage.preview ? "fixed top-0 left-0 block h-screen  w-full" : "hidden"} backdrop-blur-sm bg-[rgba(0,0,0,0.8)] flex flex-col overflow-hidden`}
    >
      <div className="flex-1 flex flex-col justify-center">
        <img
          src={close}
          className="w-10 h-10 outline-none text-[20px] font-bold absolute top-0 right-0 text-white m-4"
          onClick={() =>
            handleOutGoingMessage((prev) => ({ ...prev, preview: null, attachment: null, type: null }))
          }
        ></img>
        {outGoingMessage.preview && outGoingMessage.attachmentType?.includes("video") ? (
          <video src={outGoingMessage.preview} className="" controls />
        ) : outGoingMessage.preview && outGoingMessage.attachmentType?.includes("audio") ? (
          <audio src={outGoingMessage.preview} controls />
        ) : (
          <img
            src={outGoingMessage.preview}
            className="max-w-full max-h-full"
            alt=""
          />
        )}
      </div>
      <TypingComponent
        handleAttachment={handleAttachment}
        handleOutGoingMessage={handleOutGoingMessage}
        outGoingMessage={outGoingMessage}
        setMessages={setMessages}
        setUserConversations={setUserConversations}
      />
    </div>
  );
}
