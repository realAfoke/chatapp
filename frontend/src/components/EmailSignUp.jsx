import { useEffect, useState } from "react"; import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../utils";
import { useAuth } from "../routes/context";


export default function EmailOrPhoneSign() {
  const { setAuth } = useAuth()
  const navigate = useNavigate();
  const [inputField, setInputField] = useState({ type: "email", value: "" });
  async function checkEmailOrPhone() {
    console.log('got here bro')
    try {
      await api.post("api/auth/check-email/", {
        [inputField['type']]: inputField.value,
      });
      navigate("confirmation/", {
        state: { [inputField["type"]]: inputField.value },
      });
    } catch (error) {
      if (error.status === 409) {
        // const fieldName = Object.keys(inputField)[0];
        navigate("/login", {
          state: { [inputField["type"]]: inputField.value },
        });
      }
    }
  }
  useEffect(() => {
    console.log('inputField length:', inputField.value.length)
  }, [inputField.value])
  return (
    <div className="mx-2 py-5">
      <span className="bg-black">
        <button
          className={`py-3 px-8 outline-none ${inputField.type === "email" ? "bg-green-500 text-white" : "bg-green-900 text-black"}`}
          onClick={() => {
            if (inputField.type === "email") {
              return;
            }
            setInputField((prev) => ({ ...prev, type: "email", value: "" }));
          }}
        >
          email
        </button>
        <button
          className={`py-3 px-8 outline-none ${inputField.type === "tel" ? "bg-green-500 text-white" : "bg-green-900 text-black"}`}
          onClick={() => {
            if (inputField.type === "tel") {
              return;
            }
            setInputField((prev) => ({ ...prev, type: "tel", value: "" }));
          }}
        >
          phone
        </button>
      </span>
      <div className="flex flex-col py-5">
        <span className="text-green-700 font-semibold text-xl py-2">
          Enter your {inputField.type === "email" ? "Email" : "Phone"}
        </span>
        <input
          type={inputField.type}
          value={inputField.value}
          id=""
          placeholder={`${inputField.type === "email" ? "Enter your email address" : "Enter your mobile number"}`}
          onChange={(e) =>
            setInputField((prev) => ({ ...prev, value: e.target.value }))
          }
          className="outline-none border border-green-400 bg-green-100 p-4 rounded-[5px]"
        />
      </div>
      <div className="flex justify-center">
        <button
          className="outline-none self-center px-8 py-3 rounded-[5px] bg-green-500 text-white"
          disabled={!inputField || inputField.value.length <= 1}
          onClick={async () => {
            console.log('CLICKED!!!!')
            await checkEmailOrPhone()
          }}
        >
          continue
        </button>
      </div>
      <div className="flex justify-center p-3">
        <p className="text-green-700">Already have an account? login</p>
      </div>
    </div>
  );
}
