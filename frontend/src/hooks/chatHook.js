import { useEffect } from "react";
// import { fetchMessages } from "../utils/chatUtil";

//clean up image preview
export function closeMemoryLeaks(userContent) {
  useEffect(() => {
    return () => {
      if (userContent.preview) {
        URL.revokeObjectURL(userContent.preview);
      }
    };
  }, [userContent.preview]);
}

export function useChat(
  chatId,
  token,
  otherUser,
  socketChat,
  generalSocket,
  messages,
  setMessages,
  currentConvo,
  setConversations,
  userStatus,
  setTyping,
  userContent,
  setUserContent,
  bottomRef
) {
  useEffect(() => {
    setUserContent((prev) => ({
      ...prev,
      userId: otherUser?.id,
    }));
  }, [userStatus, otherUser]);


  useEffect(() => {
    const ws = socketChat.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      const content = {
        isTyping: userContent.isTyping,
        whoIsTyping: userContent.userId  // this is bit flawed is kinda the opposite or something
      }
      ws.send(JSON.stringify(content))
    }
  }, [userContent.content, userContent.isTyping])
  //
  useEffect(() => {
    if (!chatId) return;
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/chat/${chatId}/?token=${token}`);
    ws.onopen = () => console.log("websocket connected successfully")

    socketChat.current = ws;

    ws.onmessage = (e) => {
      let data = JSON.parse(e.data);

      if (data.status === "Read" || Array.isArray(data)) return;
      if (data.status === "active") {
        let { status, ...saferData } = data;
        setTyping(saferData);
        return;
      }
      if (data.status === "active" && !data.isTyping) {
        const { status, ...saferData } = data;
        setTyping(saferData);
        return;
      }

      if (data.action === "update msg") {
        setConversations((prev) => {
          const { conversations, ordering } = prev;

          const currentConvo = conversations[chatId];
          return {
            ...prev,
            conversations: {
              ...prev.conversations,
              [chatId]: { ...currentConvo, unreadMssgCount: 0 },
            },
            ordering: [...new Set([...ordering, Number(chatId)])],
          };
        });
        setMessages((prev) => {
          const updatedMessage = data.updatedMessages.reduce((acc, msgId) => {
            const msg = prev[msgId];
            if (!msg) return msg;
            acc[msgId] = {
              ...msg,
              readStatus: { ...(msg?.readStatus ?? {}), [data.reader]: "Read" },
            };
            return acc;
          }, {});
          return { ...prev, ...updatedMessage };
        });
        return;
      }
      setConversations((prev) => {
        const { conversations, ordering } = prev;
        const activeChat = conversations[chatId];
        if (!activeChat) return prev;
        const { readStatus, ...saferData } = data;
        //set typing
        if (data.whoIsTyping) {
          return {
            ...prev,
            conversations: {
              ...prev.conversations,
              [chatId]: {
                ...activeChat,
                typing: { ...activeChat?.typing, ...saferData },
              },
            },
          };
        }

        //set reaction
        if (saferData.reaction && !saferData?.["currentUserId"]) {
          return {
            ...prev,
            conversations: {
              ...prev.conversations,
              [chatId]: {
                ...activeChat,
                lastMssg: {
                  ...activeChat.lastMssg,
                  content: `${data.user !== otherUser.id ? "You" : otherUser.username} reacted ${saferData.reaction} to ${saferData.content}`,
                },
              },
            },
            ordering: [...new Set([Number(chatId), ...ordering])],
          };
        }
        return {
          ...prev,
          conversations: {
            ...prev.conversations,
            [chatId]: {
              ...activeChat,
              messages: [...activeChat.messages, saferData.id],
              lastMssg: { ...activeChat?.lastMssg, ...saferData },
            },
          },
          ordering: [...new Set([Number(chatId), ...ordering])],
        };
      });
      setMessages((prev) => {
        if (data?.reaction && !data?.["currentUserId"]) {
          const check = {
            ...prev,
            [data.message]: {
              ...prev[data.message],
              reaction: [...(prev[data.message].reaction ?? []), data.reaction],
            },
          };
          return check;
        }

        if (data?.content) {
          let { reader, ...msgData } = data;
          let readStatus = null
          if (userStatus.current.length > 1) {
            if (msgData?.readStatus?.[reader] === 'Inactive') {
              readStatus = 'Delivered'
            } else {
              readStatus = 'Read'
            }
          } else {
            readStatus = 'Delivered'
          }
          msgData = {
            ...msgData,
            readStatus: {
              ...msgData.readStatus,
              [reader]: readStatus
            },
          };
          return {
            ...prev,
            [msgData.id]: { ...(prev[msgData.id] || {}), ...msgData },
          };
        }
        return prev;
      });
      if (data?.readStatus && userStatus.current.length > 1) {
        const socket = generalSocket.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          const offline = { offline: data, conversationId: chatId };

          const newConvo = currentConvo
          if (newConvo?.messages?.length === 0) {
            offline["convo"] = newConvo;
          }
          socket.send(JSON.stringify(offline));
        }
        return;
      }
    };
    socketChat.current = ws;
    ws.onclose = () => console.log("websocket connection close!!!");

    return () => ws.close();
  }, [chatId, userStatus.current, otherUser]);
  //
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current?.scrollIntoView();
    }
  }, [messages]);

  //

  // useEffect(() => {
  //   setMessages(prevMessage);
  // }, [prevMessage]);

  // useEffect(() => {
  //   revalidate();
  // }, [userStatus]);
}
// export function useChatHooks(
//   conversation,
//   conversationId,
//   setChat,
//   currentUserId,
//   messages,
//   setMessages,
//   userStatus,
//   userContent,
//   setUserContent,
//   bottomRef,
//   socketChat,
//   otherUser,
// ) {
//
//   useEffect(() => {
//     setUserContent((prev) => ({
//       ...prev,
//       userId: otherUser?.id,
//     }));
//   }, [userStatus]);
//
//   useEffect(() => {
//     const socket = socketChat.current;
//     if (socket && socket.readyState === WebSocket.OPEN) {
//       const content = {
//         isTyping: userContent.isTyping,
//         whoIsTyping: userContent.userId,
//       };
//       socket.send(JSON.stringify(content));
//     }
//   }, [userContent.content, userContent.isTyping]);
//
//   useEffect(() => {
//     setChat(conversationId);
//   }, [conversationId]);
//   useEffect(() => {
//     if (bottomRef.current) {
//       bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [bottomRef]);
// }
