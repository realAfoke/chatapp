import { useEffect } from "react";
import { getLocalMsg } from "../utils/chatUtil";


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
	user,
	otherUser,
	convoMessages,
	setMessage,
	conversation,
	setConversation,
	outGoingMessage,
	setOutGoingMessage,
	chatWs,
	conversationId,
	receiverId,
	bottomRef,
	db

) {
	useEffect(() => {
		if (conversation?.unreadMssgCount) {
			const sock = chatWs.current
			if (sock && sock.readyState === WebSocket.OPEN) {
				const lastMsg = convoMessages[convoMessages.length - 1]
				sock.send(JSON.stringify({ 'conversation': conversationId, lastReadMsgId: lastMsg?.msgId ?? 0, receiverId: receiverId }))

				setConversation((prev) => {
					const { conversations } = prev
					const mainConversation = conversations?.[outGoingMessage?.conversation]
					return {
						...prev,
						conversations: { ...conversations, [outGoingMessage?.conversation]: { ...(mainConversation ?? {}), unreadMssgCount: 0 } }
					}
				})
				console.log('all message marked as read')
			}
		}
	}, [conversation.unreadMssgCount])

	useEffect(() => {
		if (db) {

			getLocalMsg(db, conversationId).then((msg) => {
				const localMsgIds = msg.map(obj => obj.clientId)
				setConversation((prev) => {
					const { conversations } = prev
					const mainConversation = conversations?.[conversationId]
					const { messages } = mainConversation
					const serverMsgId = new Set(convoMessages.map(obj => obj.clientId))
					const ex = new Set([...messages, ...localMsgIds.filter(id => !serverMsgId.has(id))])
					return {
						...prev,
						conversations: {
							...conversations,
							[conversationId]: {
								...mainConversation, messages: [...ex]
							}
						}
					}
				})
				setMessage((prev) => {
					const idsList = Object.values(prev)
					const serMsgIds = new Set(idsList.map(id => id.clientId))
					const newMsg = [...msg.filter(obj => !serMsgIds.has(obj.clientId))]
					const localMsg = Object.fromEntries(newMsg.map(obj => [obj.clientId, obj]))
					return {
						...prev,
						...localMsg
					}
				})
			}).catch((err) => {
				console.error(err)
			})
		}

	}, [db])
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current?.scrollIntoView();
		}
	}, [convoMessages]);


	useEffect(() => {
		const socket = chatWs.current
		if (outGoingMessage.text) {
			if (socket && socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ isTyping: outGoingMessage.text.length > 0 ? true : false, conversation: conversationId, receiverId: receiverId }))
			}
		}
	}, [outGoingMessage?.text])


	useEffect(() => {
		setOutGoingMessage((prev) => ({
			...prev, receiverId: otherUser?.id, sender: Number(user?.id)
		}))
	}, [otherUser])


	// useEffect(() => {
	// 	const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/users/?token=${token}`);
	// 	generalSocket.current = ws;
	// 	// ws.onopen = () => console.log("user is online");
	// 	ws.onmessage = (e) => {
	// 		let data = JSON.parse(e.data);
	//
	// 		if (data?.offline) {
	// 			let saferData = { ...data.offline };
	// 			setUserConversations((prev) => {
	// 				const { conversations, ordering } = prev;
	// 				let chatId = data.conversationId;
	// 				let convo = conversations[chatId];
	// 				let updatedConvo = (data.convo ??= {});
	//
	// 				// const convo = (data.convo ??= conversations[chatId]);
	//
	// 				//set typing
	// 				if (saferData.whoIsTyping) {
	// 					if (
	// 						Object.keys(convo || {}).length === 0 ||
	// 						convo?.typing === saferData.isTyping
	// 					)
	// 						return prev;
	// 					return {
	// 						...prev,
	// 						conversations: {
	// 							...prev.conversations,
	// 							[chatId]: {
	// 								...convo,
	// 								typing: { ...convo?.typing, ...saferData },
	// 							},
	// 						},
	// 					};
	// 				}
	// 				//set reaction
	// 				if (saferData.reaction && !saferData?.["currentUserId"]) {
	// 					const reaction = convo.lastMssg.content;
	// 					if (reaction.includes(saferData.reaction)) return prev;
	// 					const otherUser = convo.allParticipants.filter(
	// 						(participant) => participant.id !== user.id,
	// 					)[0];
	// 					return {
	// 						...prev,
	// 						conversations: {
	// 							...prev.conversations,
	// 							[chatId]: {
	// 								...convo,
	// 								lastMssg: {
	// 									...convo.lastMssg,
	// 									content: `${saferData.user !== otherUser.id ? "You" : otherUser.username} reacted ${saferData.reaction} to ${saferData.content}`,
	// 								},
	// 								unreadMssgCount: (convo.unreadMsgCount ??= 0 + 1),
	// 							},
	// 						},
	// 						ordering: [...new Set([Number(chatId), ...ordering])],
	// 					};
	// 				}
	// 				if (convo && convo?.messages?.includes(Number(saferData.id)))
	// 					return prev;
	// 				const onk = {
	// 					...prev,
	// 					conversations: {
	// 						...prev.conversations,
	// 						[chatId]: {
	// 							...(convo ?? updatedConvo),
	// 							messages: [...(convo?.messages ?? []), Number(saferData.id)],
	// 							lastMssg: { ...(convo?.lastMssg ?? {}), ...saferData },
	// 							unreadMssgCount: (convo?.unreadMssgCount ?? 0) + 1,
	// 						},
	// 					},
	// 					ordering: [...new Set([Number(chatId), ...ordering])],
	// 				};
	// 				return onk;
	// 			});
	// 			if (saferData.whoIsTyping) return;
	// 			setMessages((prev) => {
	// 				if (data?.reaction && (!"currentUserId") in data) {
	// 					const reaction = prev[saferData.message].reaction ?? [];
	// 					if (reaction.includes(saferData.reaction)) return prev;
	//
	// 					return {
	// 						...prev,
	// 						[saferData.message]: {
	// 							...prev[saferData.message],
	// 							reaction: [
	// 								...(prev[saferData.message].reaction ?? []),
	// 								saferData.reaction,
	// 							],
	// 						},
	// 					};
	// 				}
	//
	// 				if (prev[saferData.id]) return prev;
	// 				let { reader, ...mainData } = saferData;
	// 				mainData = {
	// 					...mainData,
	// 					readStatus: {
	// 						...mainData.readStatus,
	// 						[reader]: "Delivered",
	// 					},
	// 				};
	// 				return {
	// 					...prev,
	// 					[mainData.id]: { ...(prev[mainData.id] || {}), ...mainData },
	// 				};
	// 			});
	// 		} else {
	// 			setUserStatus([...new Set([...data])]);
	// 			userStatusRef.current = [...new Set([...data])];
	// 		}
	// 	};
	//
	// 	return () => (ws.close = () => console.log("connection close"));
	// }, [user]);
}
