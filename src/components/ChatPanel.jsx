import { auth, db, storage } from "../firebase/main";
import { doc, query, setDoc, collection, where, getDocs } from "firebase/firestore";
import { ref } from "firebase/storage";

import { useState, useRef } from 'react';
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { useDownloadURL } from "react-firebase-hooks/storage";

import Typography from '@mui/material/Typography';
import Avatar from "@mui/material/Avatar";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';

import SendIcon from '@mui/icons-material/Send';
import ChatBubble from "./ChatBubble";

const imageStorageRef = ref(storage, "images/");

let currentChat = "";

export default function ChatPanel({ uid, _uid }) {
	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", _uid));
	let [userImageUrl, userImageUrlLoading, userImageUrlError] = useDownloadURL(ref(imageStorageRef, _uid));
	let [drawerState, setDrawerState] = useState(false);
	let [chatState, setChatState] = useState("");
	let chatScrollDivRef = useRef(null);

	let chatName = uid > _uid ? uid + _uid : _uid + uid;
	let [chatData, chatDataLoading, chatDataError] = useDocument(doc(db, "chats", chatName));

	let user0 = uid < _uid;

	let chats = [];
	let unRead0 = false, unRead1 = false;
	if (chatData && chatData.data()) {
		chats = chatData.data().chats;
		unRead0 = chatData.data().unRead0;
		unRead1 = chatData.data().unRead1;
	}

	function chatSend() {
		if (chatState === "") return;

		chats.push({
			from: !user0 ? 1 : 0,
			message: chatState
		});

		if (user0) {
			setDoc(doc(db, "chats", chatName), {chats: chats, unRead1: true});
		} else {
			setDoc(doc(db, "chats", chatName), {chats: chats, unRead0: true});
		}

		setChatState("");

		setTimeout(() => {
			chatScrollDivRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 200);
		setTimeout(() => {
			chatScrollDivRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 500);
	}
	
	setTimeout(() => {
		chatScrollDivRef.current?.scrollIntoView({ behavior: "smooth" });
	}, 200);

	let content = "";
	if (userDataError) {
		content = <div>Error</div>;
	} else if (userDataLoading) {
		content = <div>Loading...</div>;
	} else if (userData) {
		content = <div>
			<div className="border-[2px] border-slate-400 rounded min-w-[330px] flex my-[3px] px-[20px] py-[10px] gap-x-[15px] hover:bg-slate-300 hover:border-slate-500 items-center" onClick={() => {setDrawerState(true)}}>
				<Avatar alt="name" src={userImageUrl} />
				<Typography variant="h6">{userData.data().name}</Typography>
				{ (user0 && unRead0) || (!user0 && unRead1) ? (
					<div className="w-[20px] h-[20px] bg-red-400 rounded-full text-center text-white">!</div> 
				) : (
					""
				)}
			</div>
			<Drawer className="flex flex-col" onClose={() => {
					setDrawerState(false);
					if (user0) {
						setDoc(doc(db, "chats", chatName), { unRead0: false }, { merge: true });
					} else {
						setDoc(doc(db, "chats", chatName), { unRead1: false }, { merge: true });
					}
				}} open={drawerState} anchor="bottom">
				<div className="border-[2px] border-slate-400 rounded min-w-[350px] flex m-[3px] px-[20px] py-[10px] gap-x-[15px] items-center justify-around">
					<Avatar alt="name" src={userImageUrl} />
					<Typography variant="h6">{userData.data().name}</Typography>
					<Button variant="outlined" onClick={() => {setDrawerState(false)}}>Close</Button>
				</div>
				<div className="min-h-[350px] max-h-[350px] flex flex-col gap-[3px] overflow-y-auto">
					{chats.map((data) => {
							return <ChatBubble message={data.message} fromSelf={(uid > _uid ? 1 : 0) === data.from} />;
					})}
					<div ref={chatScrollDivRef} />
				</div>
				<div className="flex justify-around items-center border-[2px] border-slate-400 rounded">
					<TextField value={chatState} onChange={(e) => {setChatState(e.target.value)}} onKeyPress={(ev) => {if (ev.key === "Enter") {ev.preventDefault(); chatSend()}}} label="Chat..." variant="filled" />
					<Button width="70" height="40" variant="outlined" onClick={chatSend} style={{maxWidth: '70px', maxHeight: '40px', minWidth: '30px', minHeight: '30px'}}><SendIcon /></Button>
				</div>
			</Drawer>
		</div>;
	}

	return <>{content}</>;
}