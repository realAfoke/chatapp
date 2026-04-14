import Camera from "../assets/icons/camera2.svg";
import { handeSelectFile, handleImageClick } from "../utils/chatUtil";
import { useRef } from "react";
export default function AttachmentBox({ setUserContent }) {
  const fileRef = useRef(null);

  return (
    <div className="shadow-sm h-100 w-full transition-all">
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
          onChange={(e) => handeSelectFile(e, setUserContent)}
        />
      </div>
    </div>
  );
}
