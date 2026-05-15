import { redirect } from "react-router-dom";
import { api } from "../utils";
import { getDb } from "../utils";
//data formatter





export function formatDate(timestamp) {
  if (!timestamp) return ""
  const mssgDate = new Date(timestamp);
  const now = new Date();
  const diff = now - mssgDate;
  const hours = diff / (1000 * 60 * 60);
  if (hours < 24) {
    return mssgDate?.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
    });
  } else if (hours < 48) {
    return "yesterday";
  } else {
    return mssgDate?.toLocaleDateString();
  }
}
//
/// fetch conversation messages
export async function fetchMessages(conversationId) {
  try {
    const contents = await api.get(
      `api/conversation/${Number(conversationId)}/messages/`,
    );
    return contents.data;
  } catch (error) { }
}


// //handle media/files selection
export function handeSelectFile(e, userInfo) {
  const file = e.target.files[0];
  // const fileName = file.type.split("/")[0];
  if (file) {
    const imageUrl = URL.createObjectURL(file);
    userInfo((prev) => ({
      ...prev,
      attachmentType: file.type,
      attachment: file,
      preview: imageUrl,
    }));
  }
}

export function handleImageClick(ref) {
  ref.current.click();
}

//fetch all conversation messages
export async function simiulateWebsock(conversationId, setMessages) {
  try {
    const contents = await api.get(
      `api/conversation/${conversationId}/messages/`,
    );
    setMessages((prev) => ({
      ...prev,
      ...Object.fromEntries(contents.data.map((msg) => [msg.id, msg])),
    }));
  } catch (error) {
    console.error(error);
  }
}
//
// //send media or file messages
export async function httpSend(
  content,
  setOutGoingMessage,
  setMessages,
  setConversation,
  conversationId,
  navigate
) {
  try {
    const formData = new FormData();
    Object.entries(content).forEach(([key, value]) => {
      if (key !== 'preview' && key !== 'sender') {
        formData.append(key, value)
      }
    })
    content.conversation = conversationId
    // await saveMessageLocally(contnt)
    setConversation((prev) => {
      const { conversations } = prev
      const mainConversation = conversations?.[conversationId]
      const { messages } = mainConversation

      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...mainConversation, lastMsg: content.text, messages: [...messages, content.clientId],
          }
        }
      }
    })
    //
    setMessages((prev) => {
      const { preview, ...rest } = content
      const msgId = content?.clientId ?? content?.msgId
      return {
        ...prev,
        [msgId]: { ...prev?.[msgId] ?? {}, ...rest, attachment: preview }
      }
    })
    setOutGoingMessage((prev) => {
      const { receiverId, text } = prev
      const reset = { receiverId, text }

      return {
        ...reset,
        text: "",
      }
    }
    );

    const apiResponse = await api.post(
      `api/conversation/${conversationId}/file-upload/`,
      formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(progressEvent.loaded * 100) / progressEvent.total
      }
    }
    )

    const { data } = apiResponse
    if (Object.hasOwn(data, 'newConversation')) {

      let { initialMessage } = apiResponse.data
      let { newConversation } = apiResponse.data
      const id = newConversation?.id
      const { msgId } = initialMessage
      const { clientId } = initialMessage
      setConversation((prev) => {
        const { serverId } = newConversation
        const { conversations, ordering } = prev
        const mainConvo = conversations?.[serverId] ?? {}
        const messages = mainConvo?.message ?? []
        const initialMessageFilteredId = [...new Set([...messages.filter(id => id !== initialMessage?.clientId), initialMessage.id])]

        let newConvo = { ...mainConvo, ...newConversation, messages: initialMessageFilteredId }

        const { [serverId]: _, ...rest } = conversations

        return {
          ...prev,
          conversations: { ...(rest ?? {}), [newConvo?.id]: newConvo },
          ordering: [...new Set([Number(newConvo.id), ...ordering.filter(id => id !== serverId)])]
        }

      })
      setMessages((prev) => {
        const existingMsg = prev?.[clientId] ?? {}
        const { [clientId]: _, ...rest } = prev
        return {
          ...rest,
          [msgId]: { ...existingMsg, ...initialMessage }
        }
      })
      navigate(`/conversations/chat/${id}`, { replace: true })
      return
    } else {
      const { msgId, clientId } = data
      setConversation((prev) => {
        const conversations = prev?.conversations ?? {}
        const mainConvo = conversations?.[conversationId]
        const messages = mainConvo?.messages ?? []
        if (messages?.includes(clientId)) {
          const filterIds = [...new Set([...messages.filter(id => id !== clientId), Number(msgId)])]
          return {
            ...prev,
            conversations: {
              ...conversations,
              [conversationId]: { ...(mainConvo ?? {}), messages: filterIds }
            }
          }
        }
      })

      setMessages((prev) => {
        if (Object.hasOwn(prev, clientId)) {
          const existingMsg = prev?.[clientId] ?? {}
          const updatedMsg = { ...existingMsg, ...data }
          const { [clientId]: _, ...rest } = prev
          return {
            ...rest,
            [msgId]: updatedMsg
          }
        }
        const delivered = { ...(prev?.[msgId] ?? {}), ...data }
        return { ...prev, [msgId]: delivered }

      })
    }
  } catch (error) {
    console.error(error);
  }
}

//
//
async function saveMessageLocally(msg) {
  const db = await getDb()
  const tx = db.transaction('messages', 'readwrite')
  const store = tx.objectStore('messages')
  const request = store.add(msg)
  // request.onsuccess = (event) => {
  // }
  request.onerror = (e) => {
    console.log('failed:', msg, e.target.error)
  }
}

//
export function getLocalMsg(db, chatId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readonly')
    const store = tx.objectStore('messages')
    const index = store.index('conversation_createdAt')

    const range = IDBKeyRange.bound([chatId, 0], [chatId, Infinity])
    const request = index.openCursor(range)

    const messages = []
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        messages.push(cursor.value)
        cursor.continue()
      } else {
        resolve(messages)
      }

    }
    // const indReq = index?.getAll(chatId)
    request.onerror = (err) => {
      reject(err)
    }
  })
}

export async function wssSend({ ref, content, setOutGoingMessage, setMessages, setConversation }) {
  const socket = ref.current;
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (content?.text === " " && !userContent?.currentUserId) return;

    content.createdAt
    if (!Object.hasOwn(content, 'reaction')) {
      // await saveMessageLocally(content)
    }
    setConversation((prev) => {
      const { conversations } = prev
      const conversationId = content.conversation
      const mainConversation = conversations?.[conversationId]
      const { messages } = mainConversation
      if ('reaction' in content) {
        return {
          ...prev,
          conversations: {
            ...(conversations ?? {}),
            [conversationId]: {
              ...(mainConversation ?? {}), reaction: `You reacted ${content.reaction} to ${content.content}`, lastInteraction: 'reaction'
            }

          }
        }
      }
      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...mainConversation, lastMsg: content.text, messages: [...messages, content.clientId],
          }
        }
      }
    })

    setMessages((prev) => {

      const msgId = content?.clientId ?? content?.msgId
      if ('reaction' in content) {
        return {
          ...prev,
          [msgId]: { ...(prev?.[msgId] ?? {}), reaction: [...(prev?.[msgId]?.reaction ?? []), content.reaction] }
        }
      }
      return {
        ...prev,
        [msgId]: { ...prev?.[msgId] ?? {}, ...content }
      }
    })

    socket.send(JSON.stringify(content));
    if (!Object.hasOwn(content, 'reaction')) {
      setOutGoingMessage((prev) => (
        {
          ...prev,
          text: "",
          // preview: null,
        }
      ));
    }

  }

}
//
function longpress(toggleReaction, message, event) {
  toggleReaction((prev) => ({
    ...prev,
    state: true,
    obj: message,
    event: event,
  }));
}
//
export function touchStart(event, setPresser, toggleReaction, message) {
  const timer = setTimeout(() => {
    longpress(toggleReaction, message, event);
  }, 1000);
  setPresser(timer);
}
//
export function touchEnd(presser) {
  clearTimeout(presser);
}
//
export function normalise(data) {
  const fullConversation = { conversations: {}, ordering: [] };
  const conversationMessages = {};
  data?.forEach((convo) => {
    fullConversation.conversations[convo.id] = { ...convo, messages: [] };
    fullConversation?.ordering.push(convo.id);
    convo.messages?.forEach((msg) => {
      conversationMessages[msg?.id] = { ...msg, conversation: convo?.id };
      fullConversation.conversations[convo?.id].messages?.push(msg?.id);
    });
  });
  return { fullConversation, conversationMessages };
}
