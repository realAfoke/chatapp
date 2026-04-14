import { api } from "../utils";
import { useLoaderData } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/chatHook";
import { normalise } from "../utils/chatUtil";

export default function Home() {
  const [userStatus, setUserStatus] = useState([]);
  const userStatusRef = useRef(null);
  const [chat, setChatId] = useState(null);
  const generalSocket = useRef(null);
  const appData = useLoaderData();
  const [miniProfile, setMiniProfile] = useState({ ...appData[1] });
  const { conversationMessages, fullConversation } = normalise(appData[0]);
  const [messages, setMessages] = useState(conversationMessages);
  const [conversationObj, setConversationObj] = useState(fullConversation);
  const [typing, setTyping] = useState({ isTyping: false, user: "" });
  const [connections, setConnections] = useState(
    appData[2].map((con) => con.connections),
  );
  //websocket state stuff
  const socketChat = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("wss://localhost/ws/users/");
    generalSocket.current = ws;
    // ws.onopen = () => console.log("user is online");
    ws.onmessage = (e) => {
      let data = JSON.parse(e.data);

      if (data?.offline) {
        let saferData = { ...data.offline };
        setConversationObj((prev) => {
          const { conversations, ordering } = prev;
          let chatId = data.conversationId;
          let convo = conversations[chatId];
          let updatedConvo = (data.convo ??= {});

          // const convo = (data.convo ??= conversations[chatId]);

          //set typing
          if (saferData.whoIsTyping) {
            if (
              Object.keys(convo || {}).length === 0 ||
              convo?.typing === saferData.isTyping
            )
              return prev;
            return {
              ...prev,
              conversations: {
                ...prev.conversations,
                [chatId]: {
                  ...convo,
                  typing: { ...convo?.typing, ...saferData },
                },
              },
            };
          }
          //set reaction
          if (saferData.reaction && !saferData?.["currentUserId"]) {
            const reaction = convo.lastMssg.content;
            if (reaction.includes(saferData.reaction)) return prev;
            const otherUser = convo.allParticipants.filter(
              (user) => user.id !== miniProfile.id,
            )[0];
            return {
              ...prev,
              conversations: {
                ...prev.conversations,
                [chatId]: {
                  ...convo,
                  lastMssg: {
                    ...convo.lastMssg,
                    content: `${saferData.user !== otherUser.id ? "You" : otherUser.username} reacted ${saferData.reaction} to ${saferData.content}`,
                  },
                  unreadMssgCount: (convo.unreadMsgCount ??= 0 + 1),
                },
              },
              ordering: [...new Set([Number(chatId), ...ordering])],
            };
          }
          if (convo && convo?.messages?.includes(Number(saferData.id)))
            return prev;
          const onk = {
            ...prev,
            conversations: {
              ...prev.conversations,
              [chatId]: {
                ...(convo ?? updatedConvo),
                messages: [...(convo?.messages ?? []), Number(saferData.id)],
                lastMssg: { ...(convo?.lastMssg ?? {}), ...saferData },
                unreadMssgCount: (convo?.unreadMssgCount ?? 0) + 1,
              },
            },
            ordering: [...new Set([Number(chatId), ...ordering])],
          };
          return onk;
        });
        if (saferData.whoIsTyping) return;
        setMessages((prev) => {
          if (data?.reaction && (!"currentUserId") in data) {
            const reaction = prev[saferData.message].reaction ?? [];
            if (reaction.includes(saferData.reaction)) return prev;

            return {
              ...prev,
              [saferData.message]: {
                ...prev[saferData.message],
                reaction: [
                  ...(prev[saferData.message].reaction ?? []),
                  saferData.reaction,
                ],
              },
            };
          }

          if (prev[saferData.id]) return prev;
          let { reader, ...mainData } = saferData;
          mainData = {
            ...mainData,
            readStatus: {
              ...mainData.readStatus,
              [reader]: "Delivered",
            },
          };
          return {
            ...prev,
            [mainData.id]: { ...(prev[mainData.id] || {}), ...mainData },
          };
        });
      } else {
        setUserStatus([...new Set([...data])]);
        userStatusRef.current = [...new Set([...data])];
      }
    };

    return () => (ws.close = () => console.log("connection close"));
  }, []);
  useChat(
    chat,
    socketChat,
    generalSocket,
    messages,
    setMessages,
    conversationObj,
    setConversationObj,
    userStatusRef,
    setTyping,
    miniProfile,
  );
  // console.log("conversationObj", conversationObj);
  return (
    <div className="h-screen overflow-y-hidden">
      <div>
        <Outlet
          context={{
            conversationObj,
            setConversationObj,
            miniProfile,
            setMiniProfile,
            connections,
            setConnections,
            userStatus,
            messages,
            setMessages,
            setChatId,
            socketChat,
            typing,
            setTyping,
          }}
        />
      </div>
    </div>
  );
}

export async function loader() {
  try {
    const conversation = api.get("api/conversations/");
    const connections = api.get("api/connection/connects/");
    const profile = api.get("api/mini-profile/");
    const responses = await Promise.allSettled([
      conversation,
      profile,
      connections,
    ]);
    const mainResponse = [];
    for (const respons of responses) {
      if (respons.status === "fulfilled") {
        mainResponse.push(respons.value.data);
      }
    }
    return mainResponse;
  } catch (error) {
    console.log("error bitch");
    console.error(error);
  }
}
