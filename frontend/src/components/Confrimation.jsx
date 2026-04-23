import { api } from "../utils";
import { useState } from "react";
import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { redirect } from "react-router-dom";
import { useAuth } from "../context";



export default function Otp() {
  const { setAuth } = useAuth()
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [hide, setHide] = useState({
    loader: false,
    message:
      "A Confrimation code was sent to this email, enter the code to confirmyour email",
  });
  const inputs = useRef([]);
  const fieldName = Object.keys(location.state)[0];
  function handleChange(value, index) {
    setCode((prev) => {
      const newOtp = [...prev];
      newOtp[index] = value ? value : "";
      return newOtp;
    });
    if (value && index <= inputs.current.length - 1) {
      if (index === inputs.current.length - 1) {
        inputs.current[index].focus();
      } else {
        inputs.current[index + 1].focus();
      }
    }
  }
  useEffect(() => {
    if (Number(code[code.length - 1]) || code[code.length - 1] !== "") {
      confrimOtp();
    }
  }, [code]);
  function confrimOtp() {
    setHide((prev) => ({ ...prev, loader: true }));
    const otp = Number(code.join(""));
    const verify = api
      .post("api/verify-otp/", {
        [fieldName]: location.state[fieldName],
        otp: otp,
      })
      .then((response) => {
        navigate("../continue", {
          state: { [fieldName]: location.state[fieldName] },
        });
      })
      .catch((e) => {
        console.error(e.response);
        setHide((prev) => ({ ...prev, message: e.response.data.error }));
      });
  }
  async function reRequestOtp() {
    try {
      const check = await api.post("api/auth/check-email/", {
        [fieldName]: location.state[fieldName],
      });
      const resp = await check.data;
      setHide((prev) => ({
        ...prev,
        message: "A new confirmation code has been sent to the email",
      }));
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <div>
      <p
        className={`px-3 ${hide.message.includes("invalid") ? "text-red-500" : "text-black"}`}
      >
        {hide.message}
      </p>
      <div className="flex justify-between mx-3 py-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            type="text"
            key={i}
            value={code[i]}
            className="p-3 outline-none border border-green-500 rounded-[5px] w-12.5 h-12.5"
            onChange={(e) => handleChange(e.target.value, i)}
            maxLength={1}
            ref={(el) => (inputs.current[i] = el)}
          />
        ))}
      </div>
      <div className="flex justify-center">
        <button
          className="self-center outline-none p-2 px-6 bg-green-500 text-white rounded-[5px] my-5"
          // disabled={(e) => e.target.value === "Verifying . . ."}
          onClick={async () => reRequestOtp()}
        >
          {hide.loader ? "Verifying. . ." : "Get new code"}
        </button>
      </div>
    </div>
  );
}
