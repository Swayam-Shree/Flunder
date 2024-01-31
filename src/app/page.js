"use client";
import { auth, db, storage } from "../firebase/main";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

import { useState } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument } from "react-firebase-hooks/firestore";
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AcUnit } from "@mui/icons-material";

const provider = new GoogleAuthProvider();
const imageStorageRef = ref(storage, "images/");

let imageField = "", nameField = "", ageField = "", genderField = "", bioField = "";
let needToUpdateData = true;
let actualImageUrl = "";

export default function Page() {
	let [userAuth, authLoading, authError] = useAuthState(auth);
	let uid = userAuth ? userAuth.uid : "_";
	
	let content = "";
	let [tabState, setTabState] = useState("1");

	let [imageUrl, imageUrlLoading, imageURLError] = useDownloadURL(ref(imageStorageRef, uid));
	if (imageUrl) {
		actualImageUrl = imageUrl;
	}
	let [imagePreviewUrl, setImagePreviewUrl] = useState("");

	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", uid));
	
	let name = "", age = "", gender = "", bio = "";
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
		if (actualImageUrl) {
			needToUpdateData = false;
		}
	}

	let [nameFieldError, setNameFieldError] = useState(false);
	let [ageFieldError, setAgeFieldError] = useState(false);
	let [genderFieldError, setGenderFieldError] = useState(false);
	let [bioFieldError, setBioFieldError] = useState(false);
	let [invalidFieldFilling, setInvalidFieldFilling] = useState(false);
	function updateData() {
		setNameFieldError(!(nameField || name));
		setAgeFieldError(!(ageField || age));
		setGenderFieldError(!(genderField || gender));
		setBioFieldError(!(bioField || bio));
		let allFieldsValid = (nameField || name) && (ageField || age) && (genderField || gender) && (imagePreviewUrl || actualImageUrl) &&
							(bioField || bio);
		setInvalidFieldFilling(!allFieldsValid);
		if (allFieldsValid) {
			setDoc(doc(db, "users", uid), {
				name: nameField ? nameField : name,
				age: ageField ? ageField : age,
				gender: genderField ? genderField : gender,
				bio: bioField ? bioField : bio
			});
			if (imageField) {
				uploadBytes(ref(imageStorageRef, uid), imageField);
				actualImageUrl = imagePreviewUrl;
				setImagePreviewUrl("");
			}
		}
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

					<div className="flex flex-col items-center border-2 border-slate-400 p-[2em] mt-[2em] rounded">
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
						</div>
					</div>

					<div className="flex flex-col items-center border-2 border-slate-400 p-[2em] mt-[4em] rounded">
						<Typography variant="h4" sx={{mb: 4}}>Update Data</Typography>

						<img src={imagePreviewUrl} hidden={!imagePreviewUrl} className="w-100 h-100 m-5" />
						<Button component="label" variant="contained" startIcon={<CloudUploadIcon />} sx={{m: 1}}>
							Upload Primary Image
								<input onChange={(e) => {imageField=e.target.files[0], setImagePreviewUrl(URL.createObjectURL(imageField))}} type="file" hidden />
						</Button>
						<TextField sx={{m: 1}} label="Name" variant="outlined" error={nameFieldError} onChange={(e) => {nameField = e.target.value}} inputProps={{ maxLength: 32 }} />
						<TextField sx={{m: 1}} label="Age" variant="outlined" type="number" error={ageFieldError} onChange={(e) => {ageField = e.target.value}} />
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
							<Typography variant="h5">You are ready to match! Wait for updates</Typography>
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