import { auth, db, storage } from "../firebase/main";
import { doc, query, setDoc, collection, where, getDocs } from "firebase/firestore";
import { ref } from "firebase/storage";

import { useState } from 'react';
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { useDownloadURL } from "react-firebase-hooks/storage";

import Typography from '@mui/material/Typography';
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";

const imageStorageRef = ref(storage, "images/");

export default function Chat({ uid, _uid }) {
	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", _uid));
	let [userImageUrl, userImageUrlLoading, userImageUrlError] = useDownloadURL(ref(imageStorageRef, _uid));
	let [drawerState, setDrawerState ] = useState(false);

	function handleClick() {

	}

	let content = "";
	if (userDataError) {
		content = <div>Error</div>;
	} else if (userDataLoading) {
		content = <div>Loading...</div>;
	} else if (userData) {
		content = <div className="border-[2px] border-slate-400 rounded min-w-[350px] flex m-[3px] px-[20px] py-[10px] gap-x-[15px] hover:bg-slate-300 hover:border-slate-500 items-center" onClick={handleClick}>
			<Avatar alt="name" src={userImageUrl} />
			<Typography variant="h6">{userData.data().name}</Typography>
		</div>;
	}

	return <>{content}</>;
}