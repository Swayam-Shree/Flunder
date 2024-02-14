"use client";
import { auth, db, storage } from "../firebase/main";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, query, setDoc, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

import { useState } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { useDownloadURL } from "react-firebase-hooks/storage";

import Image from "next/image"

import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Slider from '@mui/material/Slider';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Badge from '@mui/material/Badge';

import ChatPanel from "../components/ChatPanel";

import gpayQr from "../assets/qr.jpeg";

const provider = new GoogleAuthProvider();
const imageStorageRef = ref(storage, "images/");

let imageField = "", nameField = "", genderField = "", bioField = "", prefGenderField = "";
let actualImageUrl = "";
let needToUpdateData = true;

export default function Page() {
	let [userAuth, authLoading, authError] = useAuthState(auth);
	let uid = userAuth ? userAuth.uid : "_";
	
	let content = "";
	let [tabState, setTabState] = useState("2");
	let [inboxTabState, setInboxTabState] = useState("2");

	let [imageUrl, imageUrlLoading, imageURLError] = useDownloadURL(ref(imageStorageRef, uid));
	if (imageUrl) {
		actualImageUrl = imageUrl;
	}

	let [imagePreviewUrl, setImagePreviewUrl] = useState("");
	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", uid));

	let [dailyServerQuotaReached, setDailyServerQuotaReached] = useState(false);
	
	let name = "", age = "", gender = "", bio = "", prefMinAge = "", prefMaxAge = "", prefGender = "", rejectedUids = [], likedUids = [],
		likeMeUids = [], chattingWith = [];
	if (userDataLoading) {
		name = age = gender = bio = "Loading...";
		needToUpdateData = true;
	} else if (userDataError) {
		name = age = gender = bio = "Error";
		setDailyServerQuotaReached(true);
		needToUpdateData = true;
	} else if (userData && !userData.data()) {
		name = "Update below";
		age = "Update below";
		gender = "Update below";
		bio = "Update below"
		needToUpdateData = true;
	} else if (userData && userData.data()) {
		name = userData.data().name;
		age = userData.data().age;
		gender = userData.data().gender;
		bio = userData.data().bio;
		prefMinAge = userData.data().prefMinAge;
		prefMaxAge = userData.data().prefMaxAge;
		prefGender = userData.data().prefGender;
		rejectedUids = userData.data().rejectedUids;
		likedUids = userData.data().likedUids;
		likeMeUids = userData.data().likeMeUids;
		chattingWith = userData.data().chattingWith;
		if (actualImageUrl) {
			needToUpdateData = false;
		}
	}
	
	let [allUsers, allUsersLoading, allUsersError] = useCollection(collection(db, "users"));
	let [matchUsers, matchUsersLoading, matchUsersError] = useCollection(query(collection(db, "users"), where("gender", "==", prefGender),
		where("age", ">=", prefMinAge), where("age", "<=", prefMaxAge), where("prefGender", "==", gender)));
	let matchUsersData = [];
	if(matchUsers) {
		matchUsers.docs.forEach((doc) => {
			let data = doc.data();
			if (data.uid !== uid && !rejectedUids?.includes(data.uid) && !data.rejectedUids?.includes(uid) && !likedUids?.includes(data.uid)
				&& !data.likedUids?.includes(uid) && !chattingWith?.includes(data.uid)){
				matchUsersData.push(doc.data());
			}
		});
	}
	let [matchImageUrl, matchImageUrlLoading, matchImageURLError] = useDownloadURL(ref(imageStorageRef, matchUsersData[0]?.uid));
	
	let [likedMeUser, likedMeUsersLoading, likedMeUsersError] = useDocument(doc(db, "users", likeMeUids[0] ? likeMeUids[0] : "_"));
	likedMeUser = likedMeUser?.data();
	let [likedUserImageUrl, likedUserImageUrlLoading, likedUserImageURLError] = useDownloadURL(ref(imageStorageRef, likedMeUser?.uid));

	let [minAge, setMinAge] = useState(18);
	let [maxAge, setMaxAge] = useState(35);

	let [ageField, setAgeField] = useState(age ? age : NaN);

	let [nameFieldError, setNameFieldError] = useState(false);
	let [ageFieldError, setAgeFieldError] = useState(false);
	let [genderFieldError, setGenderFieldError] = useState(false);
	let [bioFieldError, setBioFieldError] = useState(false);
	let [invalidFieldFilling, setInvalidFieldFilling] = useState(false);

	function updateData() {
		setNameFieldError(!(nameField || !(name === "Update below")));
		setAgeFieldError(!(ageField || !(age === "Update below")));
		setGenderFieldError(!(genderField || !(gender === "Update below")));
		setBioFieldError(!(bioField || !(bio === "Update below")));
		let allFieldsValid = (nameField || name) && (ageField || age) && (genderField || gender) && (imagePreviewUrl || actualImageUrl) &&
							(bioField || bio);
		setInvalidFieldFilling(!allFieldsValid);
		
		if (allFieldsValid) {
			setDoc(doc(db, "users", uid), {
				uid: uid,
				name: nameField ? nameField : name,
				age: ageField ? ageField : age,
				gender: genderField ? genderField : gender,
				bio: bioField ? bioField : bio,
				prefMinAge: prefMinAge ? prefMinAge : minAge,
				prefMaxAge: prefMaxAge ? prefMaxAge : maxAge,
				prefGender: prefGender ? prefGender : (genderField === "male" ? "female" : "male"),
				rejectedUids: rejectedUids ? rejectedUids : [],
				likedUids: likedUids ? likedUids : [],
				likeMeUids: likeMeUids ? likeMeUids : [],
				chattingWith: chattingWith ? chattingWith : []
			}, { merge: true });
			if (imagePreviewUrl) {
				uploadBytes(ref(imageStorageRef, uid), imageField);
				actualImageUrl = imagePreviewUrl;
				setImagePreviewUrl("");
			}
			setTabState("2");
			// document.body.scrollTop = document.documentElement.scrollTop = 0;
		}
	}

	function updatePreferences() {
		setDoc(doc(db, "users", uid), {
			prefMinAge: minAge,
			prefMaxAge: maxAge,
			prefGender: prefGenderField ? prefGenderField : prefGender
		}, { merge: true });
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}

	function handlePass() {
		rejectedUids.push(matchUsersData[0].uid);
		setDoc(doc(db, "users", uid), {
			rejectedUids: rejectedUids
		}, { merge: true });
	}

	function handleLike() {
		let matchedUser = matchUsersData[0];
		likedUids.push(matchedUser.uid);
		setDoc(doc(db, "users", uid), {
			likedUids: likedUids
		}, { merge: true });
		let matchedUserLikeMeUids = matchedUser.likeMeUids ? matchedUser.likeMeUids : [];
		matchedUserLikeMeUids.push(uid);
		setDoc(doc(db, "users", matchedUser.uid), {
			likeMeUids: matchedUserLikeMeUids
		}, { merge: true });
	}

	function likedUserPass() {
		rejectedUids.push(likedMeUser.uid);
		likeMeUids.shift();
		setDoc(doc(db, "users", uid), {
			rejectedUids: rejectedUids,
			likeMeUids: likeMeUids
		}, { merge: true });
	}

	function likedUserLike() {
		likeMeUids.shift();
		chattingWith.push(likedMeUser.uid);
		setDoc(doc(db, "users", uid), {
			likeMeUids: likeMeUids,
			chattingWith: chattingWith
		}, { merge: true });
		let likedMeUserChattingWith = likedMeUser.chattingWith ? likedMeUser.chattingWith : [];
		let likedMeUserLikedUids = likedMeUser.likedUids ? likedMeUser.likedUids : [];
		likedMeUserLikedUids.splice(likedMeUserLikedUids.indexOf(uid), 1);
		likedMeUserChattingWith.push(uid);
		setDoc(doc(db, "users", likedMeUser.uid), {
			chattingWith: likedMeUserChattingWith,
			likedUids: likedMeUserLikedUids
		}, { merge: true });
	}

	let chatsJsx = chattingWith.map((_uid) => {
		return (<div>
			<ChatPanel uid={uid} _uid={_uid} />
		</div>);
	});

	let maleCount = 0;
	let femaleCount = 0;
	if (allUsers) {
		allUsers.docs.forEach((doc) => {
			let data = doc.data();
			if (data.gender === "female") {
				++femaleCount;
			} else {
				++maleCount;
			}
		});
	}

	if (authLoading) {
		content = (<div className="flex flex-col justify-center items-center">
			<Typography variant="h3">Loading...</Typography>
			<Typography variant="subtitle1">Please wait. Might take a while if network issues are present.</Typography>
		</div>);
	} else if (authError) {
		content = (<div>Error</div>);
	} else if (userAuth?.email.includes("@hyderabad.bits-pilani.ac.in")) {
		content = (<div className="min-h-[100vh]">
			<TabContext value={tabState}>
				<TabList onChange={(e, val) => {setTabState(val)}} centered>
					<Tab label="Profile" value="1" />
					<Tab label="Match" value="2" />
					<Badge badgeContent={likeMeUids.length} color="primary" overlap="circular" onClick={() => {setTabState("3")}}>
						<Tab label="Inbox" value="3" />
					</Badge>
					<Tab label="Support" value="4" />
				</TabList>

				<TabPanel className="flex flex-col items-center" value={"1"}>
					{
						dailyServerQuotaReached ? (
							<div className="flex flex-col items-center">
								<div className="flex flex-col mt-[25px] items-center border-[2px] border-slate-400 rounded min-h-[600px] min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] justify-center">
									<Typography sx={{m: 3}} variant="h3">Server Quota Reached</Typography>
									<Typography sx={{m: 3}} variant="subtitle1">Daily server quota for free server reached. Please try again tommorow.</Typography>
									<Button sx={{m: 3}} onClick={() => {location.reload}} size="large" color="error" variant="outlined">Refresh</Button>
								</div>
							</div>
						) : (
							""
						)
					}

					<Typography variant="h2">Profile</Typography>

					<div className="flex flex-col items-center min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] border-2 border-slate-400 mt-[2em] rounded p-[15px]">
						<Typography variant="h3" sx={{mb: 4}}>Your Data</Typography>

						<img src={actualImageUrl ? actualImageUrl : ""} hidden={!actualImageUrl} className="w-100 h-100 m-5 min-w-[300px] max-w-[300px] md:min-w-[350px] md:max-w-[350px] rounded" />
						<div>
							<div className="flex items-center">
								<Typography variant="subtitle2" sx={{mr: 2}}>Name: </Typography>
								<Typography variant="h6" sx={{mr: 2}}>{name} </Typography>
							</div>
							<div className="flex items-center">
								<Typography variant="subtitle2" sx={{mr: 2}}>Age: </Typography>
								<Typography variant="h6" sx={{mr: 2}}>{age}</Typography>
							</div>
							<div className="flex items-center">
								<Typography variant="subtitle2" sx={{mr: 2}}>Gender: </Typography>
								<Typography variant="h6" sx={{mr: 2}}>{gender} </Typography>
							</div>
							<div className="flex items-center">
								<Typography variant="subtitle2" sx={{mr: 2}}>Bio:</Typography>
								<Typography variant="h6">{bio}</Typography>
							</div>
							{
								needToUpdateData ? (
									""
								) : (
									<div className="flex flex-col">
										<Typography variant="h5" sx={{mt: 4}}>--- Preferences ---</Typography>
										<div className="flex items-center">
											<Typography variant="subtitle2" sx={{mr: 2}}>min-age: </Typography>
											<Typography variant="h6" sx={{mr: 2}}>{prefMinAge}</Typography>
										</div>
										<div className="flex items-center">
											<Typography variant="subtitle2" sx={{mr: 2}}>max-age: </Typography>
											<Typography variant="h6" sx={{mr: 2}}>{prefMaxAge}</Typography>
										</div>
										<div className="flex items-center">
											<Typography variant="subtitle2" sx={{mr: 2}}>Gender: </Typography>
											<Typography variant="h6" sx={{mr: 2}}>{prefGender}</Typography>
										</div>
									</div>
								)
							}
						</div>
					</div>

					{
						needToUpdateData ? (
							""
						) : (
							<div className="flex flex-col items-center min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] border-2 border-slate-400 p-[5px] mt-[2em] rounded">
								<Typography variant="h3" className="text-center" sx={{m: 4}}>Update Preferences</Typography>
								<div className="flex m-[1em]">
									<Chip sx={{mr: 2}} label="min-age"/>
									<Slider getAriaValueText={(value) => {setMinAge(value)}} sx={{width: 150}} valueLabelDisplay="auto" defaultValue={18} step={1} min={18} max={maxAge-1}/>
									<Typography sx={{ml: 2}}>{minAge}</Typography>
								</div>
								<div className="flex m-[1em]">
									<Chip sx={{mr: 2}} label="max-age"/>
									<Slider getAriaValueText={(value) => {setMaxAge(value)}} sx={{width: 150}} valueLabelDisplay="auto" defaultValue={35} step={1} min={minAge+1} max={35}/>
									<Typography sx={{ml: 2}}>{maxAge}</Typography>
								</div>
								<FormControl sx={{ m: 1, minWidth: 100 }}>
									<InputLabel id="prefGenderFieldSelectLabel">Gender</InputLabel>
									<Select label="Gender" labelId="prefGenderFieldSelectLabel" onChange={(e) => {prefGenderField = e.target.value}}>
										<MenuItem value={"male"}>Male</MenuItem>
										<MenuItem value={"female"}>Female</MenuItem>
									</Select>
								</FormControl>
								<Button sx={{m: 1}} onClick={updatePreferences} variant="outlined">Update</Button>
							</div> 
						)
					}

					<div className="flex flex-col items-center min-w-[350px] md:min-w-[550px] border-2 border-slate-400 p-[5px] mt-[4em] rounded">
						<Typography variant="h3" sx={{m: 4}}>Update Data</Typography>

						<img src={imagePreviewUrl} hidden={!imagePreviewUrl} className="w-100 h-100 m-5 min-w-[300px] max-w-[300px] md:min-w-[350px] md:max-w-[350px]" />
						<Button component="label" variant="contained" startIcon={<CloudUploadIcon />} sx={{m: 1}}>
							Upload Primary Image
								<input onChange={(e) => {imageField=e.target.files[0], setImagePreviewUrl(URL.createObjectURL(imageField))}} type="file" hidden />
						</Button>
						<TextField sx={{m: 1}} label="Name" variant="outlined" error={nameFieldError} onChange={(e) => {nameField = e.target.value}} inputProps={{ maxLength: 32 }} />
						<div className="flex m-[1em]">
							<Chip sx={{mr: 2}} label="Age"/>
							<Slider getAriaValueText={(value) => {setAgeField(value)}} sx={{width: 150}} valueLabelDisplay="auto" defaultValue={NaN} step={1} min={18} max={35}/>
							{
								ageFieldError ? (
									<Typography className="text-red-500" sx={{ml: 2}}>{ageField}</Typography>
								) : (
									<Typography sx={{ml: 2}}>{ageField}</Typography>		
								)
							}
						</div>
						<FormControl sx={{ m: 1, minWidth: 100 }}>
							<InputLabel id="genderFieldSelectLabel">Gender</InputLabel>
							<Select label="Gender" labelId="genderFieldSelectLabel" error={genderFieldError} onChange={(e) => {genderField = e.target.value}}>
								<MenuItem value={"male"}>Male</MenuItem>
								<MenuItem value={"female"}>Female</MenuItem>
							</Select>
						</FormControl>
						<TextField sx={{m: 1}} label="Bio" variant="outlined" error={bioFieldError} onChange={(e) => {bioField = e.target.value}} multiline maxRows={5} inputProps={{ maxLength: 300 }}/>
						{invalidFieldFilling ? <Typography sx={{m: 1}} variant="subtitle2">Please fill all unupdated fields and/or primary image</Typography> : ""}
						<Button sx={{m: 1}} onClick={updateData} variant="outlined">Update</Button>
					</div>

					<Button sx={{mt: 7}} size="large" color="error" onClick={() => {signOut(auth)}} variant="outlined">Sign Out</Button>

				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"2"}>
					{
						dailyServerQuotaReached ? (
							<div className="flex flex-col items-center">
								<div className="flex flex-col mt-[25px] items-center border-[2px] border-slate-400 rounded min-h-[600px] min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] justify-center">
									<Typography sx={{m: 3}} variant="h3">Server Quota Reached</Typography>
									<Typography sx={{m: 3}} variant="subtitle1">Daily server quota for free server reached. Please try again tommorow.</Typography>
									<Button sx={{m: 3}} onClick={() => {location.reload}} size="large" color="error" variant="outlined">Refresh</Button>
								</div>
							</div>
						) : (
							""
						)
					}

					<div className="flex justify-around min-w-[350px]">
						<Typography variant="subtitle2">total: {allUsers?.docs.length}</Typography>
						<Typography variant="subtitle2">men: {maleCount}</Typography>
						<Typography variant="subtitle2">women: {femaleCount}</Typography>
					</div>
					<Typography variant="h2" sx={{m: 2}}>Match</Typography>
					{
						needToUpdateData ? (
							<div className="flex flex-col text-center items-center border-[2px] border-slate-400 rounded min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] justify-center p-[20px]">
								<Typography variant="subtitle1">Please update your data in the Profile tab to start matching or refresh if already done.</Typography>
								<div className="flex justify-around m-[10px]">
									<Button sx={{m: 1}} onClick={() => {setTabState("1")}} variant="outlined">Profile</Button>
									<Button sx={{m: 1}} onClick={() => {location.reload()}} variant="outlined">Refresh</Button>
								</div>
							</div>
						) : (
							<div>
								{
									matchUsersLoading ? (
										<Typography variant="h5">Loading...</Typography>
									) : (
										<div>
											{
												matchUsersError ? (
													<Typography variant="h5">Error</Typography>
												) : (
													<div>
														{
															matchUsersData.length === 0 ? (
																<Typography sx={{p: 3}} className="flex flex-col items-center border-[2px] border-slate-400 rounded min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px]" variant="subtitle1">
																	No matches found. Please relax your preferences or wait for new users to join in. Otherwise check liked you section in inbox.
																	You might also not be getting matched if you have been passed by available users.
																</Typography>
															) : (
																<div className="flex flex-col items-center border-[2px] border-slate-400 rounded min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px]">
																	<img src={matchImageUrl ? matchImageUrl : ""} hidden={!matchImageUrl} className="w-100 h-100 m-5 min-w-[300px] max-w-[300px] md:min-w-[350px] md:max-w-[350px]" />
																	<Typography variant="h6">{matchUsersData[0].name}</Typography>
																	<Typography variant="h6">{matchUsersData[0].age}</Typography>
																	<Typography variant="h6">{matchUsersData[0].gender}</Typography>
																	<Typography variant="h6">{matchUsersData[0].bio}</Typography>

																	<div>
																		<Button onClick={handlePass} sx={{m: 3}} variant="outlined">Pass</Button>
																		<Button onClick={handleLike} sx={{m: 3}} variant="outlined">Like</Button>
																	</div>
																</div>
															)
														}
													</div>
												)
											}
										</div>
									)
								}
							</div>
						)
					}
					<div className="mt-[150px]">
						<Typography variant="h6">post release update log:</Typography>
						<Typography>server quota exceed handle</Typography>
						<Typography>qr in support</Typography>
						<Typography>wider text field for chat</Typography>
						<Typography>more support options</Typography>
						<Typography>chat notification indicators</Typography>
						<Typography>liked notification counters</Typography>
						<Typography>update log</Typography>
						<Typography>user counters</Typography>
					</div>
				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"3"}>
					<Typography variant="h2">Inbox</Typography>
					<TabContext value={inboxTabState}>
						<TabList onChange={(e, val) => {setInboxTabState(val)}} centered>
							<Badge badgeContent={likeMeUids.length} color="primary" overlap="circular" onClick={() => {setInboxTabState("1")}}>
								<Tab label="Liked You" value="1" />
							</Badge>
							<Tab label="Chats" value="2" />
						</TabList>
						<TabPanel value="1">
							<Typography variant="h4">Liked You</Typography>
							{
								likedMeUser ? (
									<div className="flex flex-col items-center min-w-[350px] md:min-w-[550px] border-[2px] border-slate-400 rounded">
										<img src={likedUserImageUrl ? likedUserImageUrl : ""} hidden={!likedUserImageUrl} className="w-100 h-100 m-5 min-w-[300px] max-w-[300px] md:min-w-[350px] md:max-w-[350px]" />
										<Typography variant="h6">{likedMeUser.name}</Typography>
										<Typography variant="h6">{likedMeUser.age}</Typography>
										<Typography variant="h6">{likedMeUser.gender}</Typography>
										<Typography variant="h6">{likedMeUser.bio}</Typography>
										<div>
											<Button onClick={likedUserPass} sx={{m: 3}} variant="outlined">Pass</Button>
											<Button onClick={likedUserLike} sx={{m: 3}} variant="outlined">Like</Button>
										</div>
									</div>
								) : (
									<Typography variant="subtitle1">no one liked you yet. hope for the best though. come back later.</Typography>
								)
							}
						</TabPanel>
						<TabPanel value="2">
							<Typography variant="h4">Chats</Typography>
							{chatsJsx}
						</TabPanel>
					</TabContext>
				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"4"}>
					<div className="flex flex-col p-[15px] items-center border-[2px] rounded border-slate-400 min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] text-center">
						<Typography variant="h2">Support</Typography>
						<Typography sx={{mt: 2}} variant="h3">Bugs</Typography>

						<Typography sx={{mt: 2}} variant="h6">Feel free to dm me for bugs on:</Typography>
						<Typography className="text-red-500" sx={{my: 2}} variant="h5">9315891040</Typography>
						{/* <Typography className="text-red-500" sx={{my: 2}} variant="h5"></Typography> */}
						<a className="text-blue-500" href="https://www.instagram.com/swayam_shree_sharma/">https://www.instagram.com/swayam_shree_sharma/</a>
						<Typography sx={{mt: 2}} variant="h6">Please report any issue and bugs at:</Typography>
						<Typography className="text-red-500" sx={{my: 2}} variant="h5">f20230354@hyderabad.bits-pilani.ac.in</Typography>
						<Typography variant="h6">Please be patient updates will be continously rolling through.</Typography>

						<Typography sx={{mt: 4}} variant="h3">Donations</Typography>
						<Typography sx={{mt: 2}} variant="h6">All donations will be reinvested into the site to obtain better servers and prevent blackouts.</Typography>
						<Image src={gpayQr} width={300} height={300} alt="gpay: 9315891040" />
					</div>
				</TabPanel>
			</TabContext>
		</div>);
	} else if (userAuth) {
		content = (<div className="flex flex-col items-center">
			<div className="flex flex-col mt-[25px] items-center border-[2px] border-slate-400 rounded min-h-[600px] min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] justify-center">
				<Typography sx={{m: 3}} variant="h3">Unauthorized</Typography>
				<Typography sx={{m: 3}} variant="subtitle1">Please use your BITS mail to access the site.</Typography>
				<Button sx={{m: 3}} onClick={() => {signOut(auth)}} size="large" color="error" variant="outlined">Sign Out</Button>
			</div>
		</div>);
	} else {
		content = (<div className="flex flex-col items-center">
			<div className="flex flex-col mt-[25px] items-center border-[2px] border-slate-400 rounded min-h-[600px] min-w-[350px] max-w-[350px] md:min-w-[550px] md:max-w-[550px] justify-center">
				<Typography className="text-center border-2 border-black rounded" variant="h3" sx={{m: 5, p: 2}}>Flunder</Typography>
				<Typography className="text-center" sx={{m: 3}} variant="h5">The site for BPHC people to form new connections around campus.</Typography>
				<Typography className="text-center" sx={{m: 3}} variant="h6">Coming to you this valentine's day, to let you find your special someone among other people.</Typography>
				<Typography className="text-center" variant="h6" sx={{m: 3}}>Site under constrution, please be patient</Typography>
				<Button sx={{mb: 2}} onClick={() => {signInWithPopup(auth, provider)}} variant="outlined" size="large">Sign In</Button>
			</div>
		</div>);
	}

	return <div>{content}</div>;
}