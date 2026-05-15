import { TypingComponent } from "./TypingBox";
import close from "../assets/icons/close.svg";
import { useEffect } from "react";
export default function Preview({
  handleOutGoingMessage,
  outGoingMessage,
  setAttachment,
  divRef
}) {
  useEffect(() => {
    if (divRef.current) {
      console.log(divRef.current.getBoundingClientRect())
    }
    setAttachment(false)
  }, [])
  const objViewPort = divRef.current.getBoundingClientRect()
  const pos = { bottom: objViewPort.top }
  return (
    <div
      className={`flex flex-col justify-center items-center absolute z-9999 block my-3 h-full w-full backdrop-blur-sm bg-[rgba(0, 0, 0, 0.8)] flex flex-col justify-center overflow-hidden`} style={pos}
    >
      <div className=" h-[calc(100%-40%)]">
        <img
          src={close}
          className="w-10 h-10 outline-none text-[20px] font-bold absolute top-20 right-0 text-white m-4"
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
            className="object-contain h-full max-w-full "
            alt=""
          />
        )}
      </div>
    </div>
  );
}
