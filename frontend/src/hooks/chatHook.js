import { act, useEffect, useState } from "react";
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
  socketChat,
  generalSocket,
  messages,
  setMessages,
  conversations,
  setConversations,
  userStatus,
  setTyping,
  miniProfile,
) {
  useEffect(() => {
    if (!chatId) return;
    const ws = new WebSocket(`wss://localhost/ws/chat/${chatId}/`);
    ws.onopen = () => console.log("websocket connected successfully");

    socketChat.current = ws;

    ws.onmessage = (e) => {
      let data = JSON.parse(e.data);

      // console.log("chat data:", data);
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
          const otherUser = activeChat.allParticipants.filter(
            (user) => user.id !== miniProfile.id,
          )[0];
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
          // console.log("data reaction:", data);
          // console.log("msgId:", data.message);
          const check = {
            ...prev,
            [data.message]: {
              ...prev[data.message],
              reaction: [...(prev[data.message].reaction ?? []), data.reaction],
            },
          };
          // console.log("check:", check);
          return check;
        }

        if (data?.content) {
          // console.log("content data:", data);
          let { reader, ...msgData } = data;
          msgData = {
            ...msgData,
            readStatus: {
              ...msgData.readStatus,
              [reader]:
                userStatus.current.length > 1 &&
                data.readStatus?.[data.reader] === "Inactive"
                  ? "Delivered"
                  : "Read",
            },
          };
          return {
            ...prev,
            [msgData.id]: { ...(prev[msgData.id] || {}), ...msgData },
          };
        }
        return prev;
      });
      // if (data?.readStatus && userStatus.current.length > 1) {
      const socket = generalSocket.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        const offline = { offline: data, conversationId: Number(chatId) };

        const newConvo = conversations?.conversations?.[chatId];
        if (newConvo?.messages?.length === 0) {
          offline["convo"] = newConvo;
        }
        socket.send(JSON.stringify(offline));
      }
      return;
      // }
    };
    socketChat.current = ws;
    // ws.onerror = (err) => console.log("ws error:", err);
    ws.onclose = () => console.log("websocket connection close!!!");

    return () => ws.close();
  }, [chatId, userStatus.current]);

  // useEffect(() => {
  //   setMessages(prevMessage);
  // }, [prevMessage]);

  // useEffect(() => {
  //   revalidate();
  // }, [userStatus]);
}
export function useChatHooks(
  conversation,
  conversationId,
  setChat,
  currentUserId,
  messages,
  setMessages,
  userStatus,
  userContent,
  setUserContent,
  bottomRef,
  socketChat,
  otherUser,
) {
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setUserContent((prev) => ({
      ...prev,
      userId: otherUser?.id,
    }));
  }, [userStatus]);

  useEffect(() => {
    const socket = socketChat.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const content = {
        isTyping: userContent.isTyping,
        whoIsTyping: userContent.userId,
      };
      socket.send(JSON.stringify(content));
    }
  }, [userContent.content, userContent.isTyping]);

  useEffect(() => {
    setChat(conversationId);
  }, [conversationId]);
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [bottomRef]);
}
