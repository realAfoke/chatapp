import Camera from "../assets/icons/camera2.svg";
import { handeSelectFile, handleImageClick } from "../utils/chatUtil";
import { useRef } from "react";
export default function AttachmentBox({ setOutGoingMessage }) {
  const fileRef = useRef(null);

  return (
    <div className="mx-3 p-3 backdrop-blur-sm bg-[rgba(0,0,0,0.2)] rounded-lg">
      <div>
        <label>
          <img
            src={Camera}
            className="w-12 h-12"
            alt=""
            onClick={() => handleImageClick(fileRef)}
          />
        </label>
        <input
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          multiple
          id=""
          ref={fileRef}
          className="invisible"
          onChange={(e) => handeSelectFile(e, setOutGoingMessage)}
        />
      </div>
    </div>
  );
}
