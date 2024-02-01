"use client";
import { auth, db, storage } from "../firebase/main";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, query, setDoc, collection, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

import { useState } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { useDownloadURL } from "react-firebase-hooks/storage";

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

	let [imageUrl, imageUrlLoading, imageURLError] = useDownloadURL(ref(imageStorageRef, uid));
	if (imageUrl) {
		actualImageUrl = imageUrl;
	}
	let [imagePreviewUrl, setImagePreviewUrl] = useState("");
	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", uid));
	
	let name = "", age = "", gender = "", bio = "", prefMinAge = "", prefMaxAge = "", prefGender = "", rejectedUids = [];
	if (userDataLoading) {
		name = age = gender = bio = "Loading...";
		needToUpdateData = true;
	} else if (userDataError) {
		name = age = gender = bio = "Error";
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
		if (actualImageUrl) {
			needToUpdateData = false;
		}
	}

	let [matchUsers, matchUsersLoading, matchUsersError] = useCollection(query(collection(db, "users"), where("gender", "==", prefGender), where("age", ">=", prefMinAge), where("age", "<=", prefMaxAge)));
	let matchUsersData = [];
	if(matchUsers) {
		matchUsers.docs.forEach((doc) => {
			let data = doc.data();
			if (data.uid !== uid && !rejectedUids?.includes(data.uid)) {
				matchUsersData.push(doc.data());
			}
		});
	}
	// console.log(matchUsersData);

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
				prefGender: prefGender ? prefGender : (gender === "male" ? "female" : "male"),
				rejectedUids: rejectedUids ? rejectedUids : []
			});
			if (imagePreviewUrl) {
				uploadBytes(ref(imageStorageRef, uid), imageField);
				actualImageUrl = imagePreviewUrl;
				setImagePreviewUrl("");
			}
		}
	}

	function updatePreferences() {
		setDoc(doc(db, "users", uid), {
			name: nameField ? nameField : name,
			age: ageField ? ageField : age,
			gender: genderField ? genderField : gender,
			bio: bioField ? bioField : bio,
			prefMinAge: minAge,
			prefMaxAge: maxAge,
			prefGender: prefGenderField ? prefGenderField : prefGender
		});
	}

	if (authLoading) {
		content = (<div>Loading...</div>);
	} else if (authError) {
		content = (<div>Error</div>);
	} else if (userAuth) {
		content = (<div>
			<TabContext value={tabState}>
				<TabList onChange={(e, val) => {setTabState(val)}} centered>
					<Tab label="Profile" value="1" />
					<Tab label="Match" value="2" />
					<Tab label="Inbox" value="3" />
				</TabList>

				<TabPanel className="flex flex-col items-center" value={"1"}>
					<Typography variant="h2">Profile</Typography>

					<div className="flex flex-col items-center min-w-[350px] border-2 border-slate-400 py-[20px] mt-[2em] rounded">
						<Typography variant="h4" sx={{mb: 4}}>Your Data</Typography>

						<img src={actualImageUrl ? actualImageUrl : ""} hidden={!actualImageUrl} className="w-100 h-100 m-5" />
						<div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>Name: </Typography>
								<Chip label={name} />
							</div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>Age: </Typography>
								<Chip label={age} />
							</div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>Gender: </Typography>
								<Chip label={gender} />
							</div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>Bio:</Typography>
								<Typography variant="subtitle2">{bio}</Typography>
							</div>
							<Typography variant="h5" sx={{mt: 4}}>Preferences</Typography>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>min-age: </Typography>
								<Chip label={prefMinAge} />
							</div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>max-age: </Typography>
								<Chip label={prefMaxAge} />
							</div>
							<div className="flex">
								<Typography variant="h6" sx={{mr: 2}}>Gender: </Typography>
								<Chip label={prefGender} />
							</div>
						</div>
					</div>

					{
						needToUpdateData ? (
							""
						) : (
							<div className="flex flex-col items-center min-w-[350px] border-2 border-slate-400 p-[5px] mt-[2em] rounded">
								<Typography variant="h4" className="text-center" sx={{m: 4}}>Update Preferences</Typography>
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

					<div className="flex flex-col items-center min-w-[350px] border-2 border-slate-400 p-[5px] mt-[4em] rounded">
						<Typography variant="h4" sx={{m: 4}}>Update Data</Typography>

						<img src={imagePreviewUrl} hidden={!imagePreviewUrl} className="w-100 h-100 m-5" />
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

					<Button sx={{mt: 5}} onClick={() => {signOut(auth)}} variant="contained">Sign Out</Button>

				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"2"}>
					<Typography variant="h2">Match</Typography>
					{
						needToUpdateData ? (
							<Typography variant="h5">Please update your data in the Profile tab to start matching</Typography>
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
																<Typography variant="h5">No matches found</Typography>
															) : (
																<div>
																	{ matchUsersData[0]?.name + "   " + matchUsersData[0]?.age + "   " + matchUsersData[0]?.gender }
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
				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"3"}>
					<Typography variant="h2">Inbox</Typography>
				</TabPanel>
			</TabContext>
		</div>);
	} else {
		content = (<div className="flex flex-col items-center">
			<Typography className="text-center border-2 border-black rounded" variant="h3" sx={{m: 5, p: 2}}>Flunder</Typography>
			<Typography className="text-center" sx={{m: 3}} variant="h5">Welcome to the Dating site for BPHC.</Typography>
			<Typography className="text-center" variant="h6" sx={{m: 3}}>Site under constrution, please be patient</Typography>
			<Button onClick={() => {signInWithPopup(auth, provider)}} variant="contained">Sign In</Button>
		</div>);
	}

	return <div>{content}</div>;
}