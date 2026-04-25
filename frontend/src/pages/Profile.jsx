import { useEffect, useState } from "react";
import { useAuth } from "../routes/context";
import { replace, useNavigate } from "react-router-dom";
import wildCard from "../assets/icons/profileIcon.svg"


export default function UserProfile() {
	const { user } = useAuth()
	const navigate = useNavigate()

	return (
		<div className=" relative h-screen overflow-hidden">
			<div className="flex flex-col overflow-hidden h-screen">
				<div className="flex self-center justify-center  bg-white rounded-full px-2 relative top-20 box-shadow-sm">
					<div className="bg-green-700 rounded-full">
						<img src={`${user?.profilePicture ? user?.profilePicture : wildCard}`} className="w-50 h-50 rounded-full" />

					</div>
				</div>
				<div className="py-20 px-5 rounded-sm flex flex-col gap-5 box-shadow-md bg-[#336333] h-screen rounded-tl-[20px] rounded-tr-[20px]">

					<div className="text-center p-5 text-white text-[20px]">{user?.bio || 'Good morning good people'}</div>
					<div className="flex gap-3 items-center">
						<span className="font-bold text-2xl text-white">Username:</span><span className="text-25 text-white font-medium">{user?.username}</span>
					</div>
					<div className="flex gap-3 items-center">
						<span className="font-bold text-2xl text-white">Email:</span><span className="text-25 text-white font-medium">{user?.email}</span>
					</div>
					<div className="flex gap-3 items-center">
						<span className="font-bold text-2xl text-white">Phone:</span><span className="text-25 font-medium">{user?.phone}</span>
					</div>

				</div>
			</div>
		</div>
	)
}
