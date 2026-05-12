import { useEffect } from "react";
// import { fetchMessages } from "../utils/chatUtil";

//clean up image preview

function snakeToCamelCase(prop) {
  if (!prop) return
  return prop.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertObjKeys(obj) {
  if (!obj) return
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [snakeToCamelCase(key), value]))
}
export function useConversation(user, setMessage, setConversation, token, wss, db, setLocalMessage) {



  useEffect(() => {
    //merge local mssgIds with cloud mssgIds
    if (user) {
      const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/chat/?token=${token}`)
      ws.onopen = () => console.log('connection is successful')
      wss.current = ws
      ws.onmessage = (e) => {
        let data = JSON.parse(e.data)

        setConversation((prev) => {
          const conversationId = data.conversation
          const { conversations, ordering } = prev
          let mainConversation = conversations?.[conversationId] ?? {}
          const messages = mainConversation?.messages ?? []

          if ('isTyping' in data) {
            return {
              ...prev,
              conversations: {
                ...conversations,
                [conversationId]: { ...(mainConversation ?? {}), typing: data.isTyping }
              }
            }


          }
          if (Object.hasOwn(data, 'newConversation')) {
            let { newConversation } = data
            let { initialMessage } = data
            const { serverId } = newConversation

            const initialMessageFilteredId = [...new Set([...messages.filter(id => id !== initialMessage?.clientId), initialMessage.id])]

            let newConvo = { ...(conversations?.[serverId] ?? {}), ...newConversation, messages: initialMessageFilteredId }
            const { [serverId]: _, ...rest } = conversations

            newConvo = convertObjKeys(newConvo)
            const { connectionRequest } = newConvo
            const fromUserInfo = convertObjKeys(connectionRequest?.from_user_info)
            newConvo = { ...(newConvo ?? {}), otherUser: convertObjKeys(newConvo.otherUser), lastMsg: initialMessage?.text, unreadMssgCount: (newConvo?.unreadMssgCount ?? 0) + 1, connectionRequest: { fromUserInfo: fromUserInfo, status: connectionRequest?.status } }
            return {
              ...prev,
              conversations: { ...(rest ?? {}), [newConvo?.id]: newConvo },
              ordering: [...new Set([Number(newConvo.id), ...ordering.filter(id => id !== serverId)])]
            }


          }

          //updating sender message status 
          if (Object.hasOwn(data, 'response')) {
            const { msgId, clientId } = data
            if (messages?.includes(clientId)) {
              const filterIds = [...new Set([...messages.filter(id => id !== clientId), Number(msgId)])]
              return {
                ...prev,
                conversations: {
                  ...conversations,
                  [conversationId]: { ...(mainConversation ?? {}), messages: filterIds }
                }
              }
            }

          }
          if (Object.hasOwn(data, 'lastReadMsgId')) {
            return {
              ...prev,
              conversations: {
                ...conversations,
                [conversationId]: { ...(mainConversation ?? {}), lastReadMsgId: data.lastReadMsgId }
              }
            }
          }
          if ('reaction' in data) {
            return {
              ...prev,
              conversations: {
                ...(conversations ?? {}),
                [conversationId]: {
                  ...(mainConversation ?? {}), recentReaction: `${data.reacter} reacted ${data.reaction} to ${data.content}`, lastInteraction: 'reaction', unreadMssgCount: (mainConversation?.unreadMssgCount ?? 0) + 1
                }

              }
            }
          }

          if (data?.text) {
            return {
              ...prev,
              conversations: {
                ...conversations,
                [conversationId]: { ...(mainConversation ?? {}), typing: false, lastMsg: data.text, lastInteraction: 'text', unreadMssgCount: (mainConversation?.unreadMssgCount ?? 0) + 1, messages: [... new Set([...(messages ?? []), data.msgId])] }
              },
              ordering: [...new Set([Number(conversationId), ...ordering])]
            }

          }
          return prev
        })
        setMessage((prev) => {

          if (Object.hasOwn(data, 'initialMessage')) {
            const { initialMessage } = data
            const camelCaseMessage = convertObjKeys(initialMessage)
            const { clientId, msgId } = camelCaseMessage
            const existingMsg = Object.hasOwn(prev, clientId) ? prev?.[clientId] : {}
            const updateExisting = { ...(existingMsg ?? {}), ...camelCaseMessage }
            const { [clientId]: _, ...rest } = prev
            const ret = {
              ...rest,
              [msgId]: updateExisting
            }
            return ret

          }
          if (Object.hasOwn(data, 'message')) {
            let { message } = data
            message = convertObjKeys(message)
            return
          }
          //updating sender message status 
          if ('response' in data) {
            const { response, ...restData } = data
            const { msgId, clientId } = restData

            if (clientId in prev) {
              const existingMsg = prev?.[clientId] ?? {}
              const updatedMsg = { ...existingMsg, ...restData }
              const { [clientId]: _, ...rest } = prev
              return {
                ...rest,
                [msgId]: updatedMsg
              }
            }
            const delivered = { ...(prev?.[msgId] ?? {}), ...restData }
            return { ...prev, [msgId]: delivered }

          }
          if ('reaction' in data) {
            return {
              ...prev,
              [data.msgId]: { ...(prev?.[data.msgId] ?? {}), reaction: [...(prev?.[data.msgId]?.reaction ?? []), data.reaction] }
            }
          }

          if (data?.text) {
            return {
              ...prev,
              [data.msgId]: { ...prev?.[data.msgId], ...data }
            }
          }
          return prev
        })


        //add incoming message to messages
        if (Object.hasOwn(data, 'text') || Object.hasOwn(data, 'newConversation')) {
          const conversation = data?.newConversation ?? {}
          const message = data?.initialMessage ?? {}
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ status: 'received', conversation: data?.conversation ?? conversation?.id, receiverId: data?.sender ?? message?.sender, clientId: data?.clientId ?? message?.clientId, msgId: data?.msgId ?? message?.msgId }))
          }
        }
      }
      ws.onclose = () => console.log('connection closed !!!')

      return () => ws.close()
    }
  }, [user])
}
