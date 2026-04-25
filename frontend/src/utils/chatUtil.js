import { api } from "../utils";
//data formatter
export function formatDate(timestamp) {
  const mssgDate = new Date(timestamp);
  const now = new Date();
  const diff = now - mssgDate;
  const hours = diff / (1000 * 60 * 60);
  if (hours < 24) {
    return mssgDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
    });
  } else if (hours < 48) {
    return "yesterday";
  } else {
    return mssgDate.toLocaleDateString();
  }
}

/// fetch conversation messages
// export async function fetchMessages(conversationId) {
//   try {
//     const contents = await api.get(
//       `api/conversation/${Number(conversationId)}/messages/`,
//     );
//     return contents.data;
//   } catch (error) {}
// }

//handle media/files selection
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
    console.log(setMessages);
    setMessages((prev) => ({
      ...prev,
      ...Object.fromEntries(contents.data.map((msg) => [msg.id, msg])),
    }));
  } catch (error) {
    console.error(error);
  }
}

//send media or file messages
export async function httpSend(
  userContent,
  conversationId,
  setUserContent,
  ref,
) {
  try {
    const formData = new FormData();
    Object.entries(userContent).forEach(([key, value]) => {
      if (key !== "type" && key !== "preview") formData.append(key, value);
    });
    const file = await api.post(
      `api/conversation/${conversationId}/file-upload/`,
      formData,
    );
    await wssSend({
      ref: ref,
      userContent: file.data,
      setUserContent: setUserContent,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function wssSend({ ref, userContent, setUserContent }) {
  const socket = ref.current;
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (userContent?.content === " " && !userContent?.currentUserId) return;
    const data = userContent.currentUserId
      ? userContent
      : { content: userContent.content, userId: userContent.userId || null };
    socket.send(JSON.stringify(data));
    setUserContent((prev) => ({
      ...prev,
      content: "",
      msgId: "",
      preview: null,
    }));
  }
}

function longpress(toggleReaction, message, event) {
  toggleReaction((prev) => ({
    ...prev,
    state: true,
    obj: message,
    event: event,
  }));
}

export function touchStart(event, setPresser, toggleReaction, message) {
  const timer = setTimeout(() => {
    longpress(toggleReaction, message, event);
  }, 1000);
  setPresser(timer);
}

export function touchEnd(presser) {
  clearTimeout(presser);
}

export function normalise(data) {
  const fullConversation = { conversations: {}, ordering: [] };
  const conversationMessages = {};
  data.forEach((convo) => {
    fullConversation.conversations[convo.id] = { ...convo, messages: [] };
    fullConversation.ordering.push(convo.id);
    convo.messages.forEach((msg) => {
      conversationMessages[msg.id] = { ...msg, conversation: convo.id };
      fullConversation.conversations[convo.id].messages.push(msg.id);
    });
  });
  return { fullConversation, conversationMessages };
}
