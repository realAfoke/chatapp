import { useEffect } from "react";
import { getLocalMsg } from "../utils/chatUtil";
import { useParams } from "react-router-dom";


export function closeMemoryLeaks(outGoingMessage) {
	useEffect(() => {
		return () => {
			if (outGoingMessage.preview) {
				URL.revokeObjectURL(outGoingMessage.preview);
			}
		};
	}, [outGoingMessage?.preview]);
}

export function useChat(
	otherUser,
	convoMessages,
	conversation,
	setConversation,
	outGoingMessage,
	setOutGoingMessage,
	chatWs,
	conversationId,
	bottomRef,
	db

) {
	const { chatId } = useParams()
	useEffect(() => {
		if (conversation?.unreadMssgCount) {

			const sock = chatWs.current
			if (sock && sock.readyState === WebSocket.OPEN) {
				const lastMsg = convoMessages[convoMessages.length - 1]
				const read = { 'conversation': conversationId, lastReadMsgId: lastMsg?.msgId ?? conversation?.lastReadMsgId, receiverId: otherUser?.id }
				sock.send(JSON.stringify(read))

				setConversation((prev) => {
					const { conversations } = prev
					const mainConversation = conversations?.[chatId]
					return {
						...prev,
						conversations: { ...conversations, [chatId]: { ...(mainConversation ?? {}), unreadMssgCount: 0 } }
					}
				})
			}
		}
	}, [conversation.unreadMssgCount, otherUser])

	useEffect(() => {
		// if (db) {
		//
		// 	getLocalMsg(db, conversationId).then((msg) => {
		// 		const localMsgIds = msg.map(obj => obj.clientId)
		// 		setConversation((prev) => {
		// 			const { conversations } = prev
		// 			const mainConversation = conversations?.[conversationId] ?? {}
		// 			const messages = mainConversation?.messages ?? []
		// 			const serverMsgId = new Set(convoMessages.map(obj => obj.clientId))
		// 			const ex = new Set([...messages, ...localMsgIds.filter(id => !serverMsgId.has(id))])
		// 			return {
		// 				...prev,
		// 				conversations: {
		// 					...conversations,
		// 					[conversationId]: {
		// 						...mainConversation, messages: [...ex]
		// 					}
		// 				}
		// 			}
		// 		})
		// 		setMessage((prev) => {
		// 			const idsList = Object.values(prev)
		// 			const serMsgIds = new Set(idsList.map(id => id.clientId))
		// 			const newMsg = [...msg.filter(obj => !serMsgIds.has(obj.clientId))]
		// 			const localMsg = Object.fromEntries(newMsg.map(obj => [obj.clientId, obj]))
		// 			return {
		// 				...prev,
		// 				...localMsg
		// 			}
		// 		})
		// 	}).catch((err) => {
		// 		console.error(err)
		// 	})
		// }

	}, [db])
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current?.scrollIntoView();
		}
	}, [convoMessages]);


	useEffect(() => {

		// if (!outGoingMessage?.text || convoMessages?.length <= 0) return
		const socket = chatWs.current

		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ isTyping: outGoingMessage.text.length > 0 ? true : false, conversation: conversationId, receiverId: otherUser?.id }))
		}
	}, [outGoingMessage?.text])


	useEffect(() => {
		if (!otherUser) return
		setOutGoingMessage((prev) => ({
			...prev, receiverId: otherUser?.id
		}))
	}, [otherUser?.id])
}
