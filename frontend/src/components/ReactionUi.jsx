import { useEffect, useState } from "react";
// import { wssSend } from "../utils/chat";
import replyIcon from "../assets/icons/reply.svg";
import deleteIcon from "../assets/icons/delete.svg";
import copyIcon from "../assets/icons/copy.svg";
import forwardIcon from "../assets/icons/forward.svg";
import { wssSend } from "../utils/chatUtil";
import { useAuth } from "../routes/context";

export default function ReactionUi({
  message,
  event,
  setShowReactionUi,
  receiverId
  // conversationId,
}) {
  const { user, chatWs, setMessages, setUserConversations } = useAuth()
  const [reaction, setReaction] = useState(null);
  useEffect(() => {
    window.addEventListener("click", () => {
      setShowReactionUi({ obj: "", state: false, event: "" });
    });
  }, []);

  function sendReaction(selectedReaction) {
    const content = {
      msgId: message.id,
      reacter: user?.username,
      reaction: selectedReaction,
      content: message.text,
      conversation: message.conversation,
      receiverId: receiverId
    }

    wssSend({ ref: chatWs, content: content, setMessages: setMessages, setConversation: setUserConversations })
  }
  const getPosition = (e) => {
    const el = e.target
    const pos = el.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return {
        top: e.touches[0].clientY,
      };
    } else {
      return {
        top: e.clientY,
      };
    }
  };
  const position = getPosition(event);
  let EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];
  EMOJIS = EMOJIS.map((emoji, i) => {
    return (
      <li
        key={i}
        className="w-10 h-10"
        onClick={(e) => {
          e.stopPropagation();
          sendReaction(emoji);
          setShowReactionUi({ obj: "", state: false, event: "" });
        }}
      >
        {emoji}
      </li>
    );
  });

  return (
    <div className="fixed flex flex-col z-9999 top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.3)] backdrop-blur-sm p-3">
      <div
        style={{
          top: position.top,
          alignSelf: message.align,
          position: "absolute",
        }}
        className="max-w-70 flex flex-col flex-wrap"
      >
        <p className="flex text-white bg-[#336333] py-1 px-2 rounded-sm">
          {message?.content}
        </p>
        <ul className=" flex pt-3">{EMOJIS}</ul>
        <div className="bg-[#336333] p-4 flex flex-col gap-2 rounded-sm">
          <p className="flex justify-between">
            <span>reply</span>
            <img src={replyIcon} className="w-5 h-5" alt="" />
          </p>
          <p className="flex justify-between">
            <span>forward</span>
            <img src={forwardIcon} className="w-5 h-5" alt="" />
          </p>
          <p className="flex justify-between">
            <span>copy</span>
            <img src={copyIcon} className="w-5 h-5" alt="" />
          </p>
          <p className="flex justify-between">
            <span>delete for me</span>
            <img src={deleteIcon} className="w-5 h-5" alt="" />
          </p>
          <p className="flex justify-between">
            <span>delete for everyone</span>
            <img src={deleteIcon} className="w-5 h-5" alt="" />
          </p>
        </div>
      </div>
    </div>
  );
}
