import { useEffect } from "react";
export function useConversationHooke(
	user,
	token,
	setUserConversations,
	setMessages,
	setUserStatus,
	userStatusRef,
	generalSocket,
) {
	useEffect(() => {
		const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}ws/users/?token=${token}`);
		generalSocket.current = ws;
		// ws.onopen = () => console.log("user is online");
		ws.onmessage = (e) => {
			let data = JSON.parse(e.data);

			if (data?.offline) {
				let saferData = { ...data.offline };
				setUserConversations((prev) => {
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
							(participant) => participant.id !== user.id,
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
	}, [user]);
}
