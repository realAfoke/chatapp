import { TypingComponent } from "./TypingBox";
import close from "../assets/icons/close.svg";
export default function Preview({
  handleAttachment,
  handleUserContent,
  userContent,
  handleWsSend,
  message,
  setMessages,
  conversationId,
  socketChat,
}) {
  return (
    <div
      className={`${userContent.preview ? "fixed top-0 left-0 block h-screen  w-full" : "hidden"} backdrop-blur-sm bg-[rgba(0,0,0,0.8)] flex flex-col overflow-hidden`}
    >
      <div className=" max-h-[calc(100%-10%)] min-h-[calc(100%-10%)] flex flex-col justify-center">
        <img
          src={close}
          className="w-10 h-10 outline-none text-[20px] font-bold absolute top-0 right-0 text-white m-4"
          onClick={() =>
            handleUserContent((prev) => ({ ...prev, preview: null, attachment: null, type: null }))
          }
        ></img>
        {userContent.preview && userContent.type?.includes("video") ? (
          <video src={userContent.preview} controls />
        ) : userContent.preview && userContent.type?.includes("audio") ? (
          <audio src={userContent.preview} controls />
        ) : (
          <img
            src={userContent.preview}
            className="max-w-full max-h-full"
            alt=""
          />
        )}
      </div>
      <TypingComponent
        handleUserContent={handleUserContent}
        handleAttachment={handleAttachment}
        userContent={userContent}
        handleWsSend={handleWsSend}
        message={message}
        setMessages={setMessages}
        conversationId={conversationId}
        socketChat={socketChat}
      />
    </div>
  );
}
