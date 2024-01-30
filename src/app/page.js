"use client";
import { auth, db } from "../firebase/main";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { useState } from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument } from "react-firebase-hooks/firestore";

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

const provider = new GoogleAuthProvider();

let nameField = "", ageField = "", genderField = "";
let needToUpdateData = true;

export default function Page() {
	let [userAuth, authLoading, authError] = useAuthState(auth);
	let uid = userAuth ? userAuth.uid : "_";
	let [userData, userDataLoading, userDataError] = useDocument(doc(db, "users", uid));
	let [tabState, setTabState] = useState("2");
	
	let content = "";

	let name = "", age = "", gender = "";
	if (userDataLoading) {
		needToUpdateData = true;
		name = "Loading...";
		age = "Loading...";
		gender = "Loading...";
	} else if (userData && !userData.data()) {
		needToUpdateData = true;
		name = "Update below";
		age = "Update below";
		gender = "Update below";
	} else if (userData && userData.data()) {
		needToUpdateData = false;
		name = userData.data().name;
		age = userData.data().age;
		gender = userData.data().gender;
	}

	let [nameFieldError, setNameFieldError] = useState(false);
	let [ageFieldError, setAgeFieldError] = useState(false);
	let [genderFieldError, setGenderFieldError] = useState(false);
	let [invalidFieldFilling, setInvalidFieldFilling] = useState(false);
	function updateData() {
		nameField ? setNameFieldError(false) : setNameFieldError(true);
		ageField ? setAgeFieldError(false) : setAgeFieldError(true);
		genderField ? setGenderFieldError(false) : setGenderFieldError(true);
		let allFieldsValid = nameField && ageField && genderField;
		setInvalidFieldFilling(!allFieldsValid);
		if (allFieldsValid) {
			setDoc(doc(db, "users", uid), {
				name: nameField,
				age: ageField,
				gender: genderField		
			});
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
					<Typography variant="h3">Profile</Typography>

					<Typography sx={{mt: 5}} variant="h5">Your Data</Typography>

					<div className="flex">
						<Typography variant="subtitle1">Name: </Typography>
						<Chip label={name} />
					</div>
					<div className="flex">
						<Typography variant="subtitle1">Age: </Typography>
						<Chip label={age} />
					</div>
					<div className="flex">
						<Typography variant="subtitle1">Gender: </Typography>
						<Chip label={gender} />
					</div>

					<Typography sx={{mt: 5}} variant="h5">Update Data</Typography>

					<TextField sx={{m: 1}} label="Name" variant="outlined" error={nameFieldError} onChange={(e) => {nameField = e.target.value}} />
					<TextField sx={{m: 1}} label="Age" variant="outlined" type="number" error={ageFieldError} onChange={(e) => {ageField = e.target.value}} />
					<FormControl sx={{ m: 1, minWidth: 100 }}>
						<InputLabel id="genderFieldSelectLabel">Gender</InputLabel>
						<Select label="Gender" labelId="genderFieldSelectLabel" error={genderFieldError} onChange={(e) => {genderField = e.target.value}}>
							<MenuItem value={"male"}>Male</MenuItem>
							<MenuItem value={"female"}>Female</MenuItem>
						</Select>
					</FormControl>
					{invalidFieldFilling ? <Typography sx={{m: 1}} variant="subtitle2">Please fill valid values and fill all the fields</Typography> : ""}
					<Button sx={{m: 1}} onClick={updateData} variant="outlined">Update</Button>

					<Button sx={{mt: 5}} onClick={() => {signOut(auth)}} variant="contained">Sign Out</Button>

				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"2"}>
					<Typography variant="h3">Match</Typography>
					{
						needToUpdateData ? (
							<Typography variant="h5">Please update your data in the Profile tab to start matching</Typography>
						) : (
							<Typography variant="h5">You are ready to match! Wait for updates</Typography>
						)
					}
				</TabPanel>
				<TabPanel className="flex flex-col items-center" value={"3"}>
					<Typography variant="h3">Inbox</Typography>
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