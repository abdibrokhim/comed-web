'use client';

import Image from "next/image";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import React, { useEffect, useState, useRef } from 'react';
import { faAdd, faChevronDown, faClose, faFile, faChevronLeft, faChevronRight, faCompass, faShare, faPrint, faUpRightAndDownLeftFromCenter, faExpand, faSquareCheck, faTrash, faCircleCheck, faClone, faPenNib, faSquareMinus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Patient, Observation, Hospital, PatientObservation, ObservationDefaultView } from './types';
import Notification from './notify';
import { NextResponse } from 'next/server'
import { getFirestore, collection, getDocs, getDoc, setDoc, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage';
import { app } from './firebaseConfig';

const storage = getStorage(app);
const firestore = getFirestore(app);

export default function Home() {
  const {isLoaded, isSignedIn, user} = useUser();
  const [showUploadImageView, setShowUploadImageView] = useState(false);
  const [showPortalView, setShowPortalView] = useState(false);
  const [showReportView, setShowReportView] = useState(false);
  const [isAddingScanAndPatient, setIsAddingScanAndPatient] = useState(false);
  const [isUploadingScans, setIsUploadingScans] = useState(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientBirthYear, setPatientBirthYear] = useState('');
  const [patientPhoneNumber, setPatientPhoneNumber] = useState('');
  const [scanUrls, setScanUrls] = useState([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' |'info' } | null>(null);  // notification message
  const [hospitalData, setHospitalData] = useState<Hospital | null>(null);
  const [hospitalId, setHospitalId] = useState('');
  const [allObservations, setAllObservations] = useState<PatientObservation[]>([]);
  const [showExpandedObservation, setShowExpandedObservation] = useState(false);
  const [showExpandedConclusion, setShowExpandedConclusion] = useState(false);
  const [isFetchingObservationById, setIsFetchingObservationById] = useState(false);
  const [expandObservationIndex, setExpandObservationIndex] = useState('');
  const [defaultViewObservations, setDefaultViewObservations] = useState<ObservationDefaultView[]>([]);
  const [oneObservation, setOneObservation] = useState<PatientObservation | null>(null);
  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);
  const [radiologistName, setRadiologistName] = useState('');
  const [isRegeneratingConclusion, setIsRegeneratingConclusion] = useState(false);
  const [isDeletingObservation, setIsDeletingObservation] = useState(false);
  const [isSavingObservation, setIsSavingObservation] = useState(false);
  const [isSegmentingScans, setIsSegmentingScans] = useState(false);
  const [isApprovingObservation, setIsApprovingObservation] = useState(false);
  const [savingPatientDetails, setSavingPatientDetails] = useState(false);
  const [refetch, setRefetch] = useState(false);
  const [segmentResult, setSegmentResult] = useState<any>(null);
  const [refetchHospitalDetails, setRefetchHospitalDetails] = useState(false);
  
  const sampleData = [
    {imageUrl: "https://firebasestorage.googleapis.com/v0/b/chatwithpdf-30e42.appspot.com/o/images%2F1724335515486.jpg?alt=media&token=3b886b80-3815-4146-b548-1d3dd27e4643"},
    {imageUrl: "https://firebasestorage.googleapis.com/v0/b/chatwithpdf-30e42.appspot.com/o/images%2F1724336411144.jpg?alt=media&token=b7cbd4c8-58ea-4e7a-8ec3-dc04440c7f2b"},
    {imageUrl: "https://firebasestorage.googleapis.com/v0/b/chatwithpdf-30e42.appspot.com/o/images%2F1724362545562.jpg?alt=media&token=dcc805c0-b4ce-4574-adf4-c3354a90c7bc"},
  ]

  // refs
  const expandRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Create a ref for the file input

  // on first sign up we will save the hospital details to firestore
  useEffect(() => {
    if (isSignedIn && user) {
      const hId = user.id;
      setHospitalId(hId);
      // save hospital details
      registerHospital();
      // fetch hospital details
      // fetchHospitalDetails();
    }
  }, [isSignedIn, user]);

  // register hospital to firestore
  const registerHospital = async () => {
    try {
      const hospitalRef = await addDoc(collection(firestore, 'hospitals'), {
        id: hospitalId,
        name: '',
        department: '',
        address: '',
        phone: '',
        email: user?.emailAddresses,
      });
      console.log('Hospital registered with ID:', hospitalId);
      triggerNotification('Hospital registered successfully', 'success');
    } catch (error) {
      console.error('Error registering hospital:', error);
      triggerNotification('An error occurred while registering hospital', 'error');
    } finally {
      setRefetchHospitalDetails(true);
    }
  }

  // Close the expanded image if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
        if (expandRef.current && !expandRef.current.contains(event.target)) {
          setShowExpandedObservation(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

      // show notification
      const triggerNotification = (nMessage: string, nType: 'error' | 'success' | 'info') => {
        setNotification({ message: nMessage, type: nType });
    };

  const loader = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
      <circle cx={4} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale0" attributeName="r" begin="0;svgSpinners3DotsScale1.end-0.25s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={12} cy={12} r={3} fill="currentColor">
        <animate attributeName="r" begin="svgSpinners3DotsScale0.end-0.6s" dur="0.75s" values="3;.2;3" />
      </circle>
      <circle cx={20} cy={12} r={3} fill="currentColor">
        <animate id="svgSpinners3DotsScale1" attributeName="r" begin="svgSpinners3DotsScale0.end-0.45s" dur="0.75s" values="3;.2;3" />
      </circle>
    </svg>
  );

  const handleShowUploadImageView = () => {
    setShowUploadImageView(true);
    // setShowPortalView(false);
    // setShowReportView(false);
  }

  const handleShowPortalView = () => {
    setShowUploadImageView(false);
    setShowPortalView(true);
    setShowReportView(false);
  }

  const handleShowReportView = () => {
    setShowUploadImageView(false);
    setShowPortalView(false);
    setShowReportView(true);
  }

  const proceedWithScans = async () => {
    setShowUploadImageView(false);
    setShowExpandedConclusion(true);
    const infos = await handleSegmentScans();
    await uploadScansToFirebaseStorage();
    if (scanUrls.length === 0) {
      triggerNotification('Something went wrong on setScanUrls state', 'error');
      setIsSavingObservation(false);
      return
    }
    console.log("segmented scans", infos);
    if (infos) {
      handleGenerateConclusion(infos);
    }
  }

  // generate conclusion
  const handleGenerateConclusion = async ({ segmentedData } : { segmentedData: any}) => {
    setIsGeneratingConclusion(true);
    triggerNotification('Generating conclusion...', 'info');
    try {
      const result = await fetch('/api/generate', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        body: JSON.stringify(segmentedData),
      })
      const resultJson = await result.json()
      
      const {error} = resultJson
      
      if (error) {
        console.warn(error.message)
        triggerNotification(error.message, 'error')
      } else {
        console.log(resultJson)
        setConclusion(resultJson)
        triggerNotification('Conclusion generated successfully', 'success')
        return true;
      }
    } catch (error) {
      console.error(error)
      triggerNotification('An error occurred', 'error')
    } finally {
      setIsGeneratingConclusion(false)
      return false;
    }
  };

  // segment brain mri scans
  const handleSegmentScans = async () => {
    setIsSegmentingScans(true);
    triggerNotification('Segmenting scans...', 'info');
    try {
      const result = await fetch('/api/segment', {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
      })
      const resultJson = await result.json()
      
      const {error} = resultJson
      
      if (error) {
        console.warn(error.message)
        triggerNotification(error.message, 'error')
      } else {
        console.log(resultJson)
        triggerNotification('Scans segmented successfully', 'success')
        setSegmentResult(resultJson)
        return resultJson
      }
    } catch (error) {
      console.error(error)
      triggerNotification('An error occurred', 'error')
    } finally {
      setIsSegmentingScans(false)
    }
  };
  
  // upload image file(s) to firebase storage and return the download url(s)
  const uploadScansToFirebaseStorage = async () => {
    setIsUploadingScans(true);
    triggerNotification('Uploading scans...', 'info');
    try {
      const uploadPromises = droppedFiles.map(async (file: File) => {
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, file); // Directly use 'file' without '.buffer'
        const url = await getDownloadURL(storageRef);
        return url;
      });

      const urls: any = await Promise.all(uploadPromises); // Wait for all uploads to complete
      setScanUrls(urls); // Update the scan URLs state once all are uploaded
      triggerNotification('Scans uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading files:', error); // Log the actual error for debugging
      triggerNotification('An error occurred during upload', 'error');
    } finally {
      setIsUploadingScans(false);
    }
  };

  // export interface Observation {
  //     id: number;
  //     patientId: string;
  //     imageUrls: [string];
  //     conclusionText: string;
  //     radiologistName: string;
  //     headDoctorName: string;
  //     reportUrl: string;
  //     status: string;
  //     updatedAt: Timestamp;
  //     createdAt: Timestamp;
  // }
  // save observation to firestore
  const saveObservation = async () => {
    setIsSavingObservation(true);
    triggerNotification('Saving observation...', 'info');
    try {
      const observationRef = await addDoc(collection(firestore, 'hospitals', hospitalId, 'observations'), {
        patientId: patientId,
        imageUrls: scanUrls,
        conclusionText: conclusion,
        radiologistName: radiologistName,
        headDoctorName: "",
        reportUrl: '',
        status: 'pending',
        updatedAt: new Date(),
        createdAt: new Date(),
      });
      console.log('Observation saved with ID:', observationRef.id);
      triggerNotification('Observation saved successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error saving observation:', error);
      triggerNotification('An error occurred while saving observation', 'error');
    } finally {
      setIsSavingObservation(false);
      return false;
    }
  };
//   export interface PatientObservation {
//     id: string;
//     patientId: string;
//     patientDetails: Patient;
//     imageUrls: [string];
//     conclusionText: string;
//     radiologistName: string;
//     headDoctorName: string;
//     reportUrl: string;
//     status: string;
//     updatedAt: Timestamp;
//     createdAt: Timestamp;
// }
  // fetch all observations, use PatientObservation type
  const fetchAllObservations = async () => {
    try {
      const observationsRef = collection(firestore, 'hospitals', hospitalId, 'observations');
      const observationsSnapshot = await getDocs(observationsRef);
      const observationsData: PatientObservation[] = [];
  
      for (const doc of observationsSnapshot.docs) {
        const observationData = doc.data() as Observation;
  
        // Fetch patient details using await to ensure we get the actual patient data
        const patientDetails = await fetchPatientDetails(observationData.patientId);
  
        if (!patientDetails) {
          console.warn(`No patient details found for patient ID: ${observationData.patientId}`);
          triggerNotification(`No patient data found for patient ID: ${observationData.patientId}`, 'error');
          continue; // Skip this iteration if patient details are not found
        }
  
        const observation: PatientObservation = {
          id: doc.id,
          patientId: observationData.patientId,
          patientDetails: patientDetails, // Now this is of type Patient, not Promise<Patient | undefined>
          imageUrls: observationData.imageUrls,
          conclusionText: observationData.conclusionText,
          radiologistName: observationData.radiologistName,
          headDoctorName: observationData.headDoctorName,
          reportUrl: observationData.reportUrl,
          status: observationData.status,
          updatedAt: observationData.updatedAt,
          createdAt: observationData.createdAt,
        };
        observationsData.push(observation);
      }
  
      setAllObservations(observationsData);
    } catch (error) {
      console.error('Error fetching observations:', error);
      triggerNotification('An error occurred while fetching observations', 'error');
    }
  };

  // fetch observation by id
  const fetchObservationById = async (observationId: string): Promise<void> => {
    setIsFetchingObservationById(true);
    triggerNotification('Fetching observation...', 'info');
    try {
      const observationRef = doc(firestore, 'hospitals', hospitalId, 'observations', observationId);
      const observationSnapshot = await getDoc(observationRef);
  
      if (!observationSnapshot.exists()) {
        console.warn(`No observation found for ID: ${observationId}`);
        triggerNotification(`No observation found for ID: ${observationId}`, 'error');
        return;
      }
  
      const observationData = observationSnapshot.data() as Observation;
  
      // Fetch patient details using await to ensure we get the actual patient data
      const patientDetails = await fetchPatientDetails(observationData.patientId);
  
      if (!patientDetails) {
        console.warn(`No patient details found for patient ID: ${observationData.patientId}`);
        triggerNotification(`No patient data found for patient ID: ${observationData.patientId}`, 'error');
        return;
      }
  
      const observation: PatientObservation = {
        id: observationSnapshot.id,
        patientId: observationData.patientId,
        patientDetails: patientDetails,
        imageUrls: observationData.imageUrls,
        conclusionText: observationData.conclusionText,
        radiologistName: observationData.radiologistName,
        headDoctorName: observationData.headDoctorName,
        reportUrl: observationData.reportUrl,
        status: observationData.status,
        updatedAt: observationData.updatedAt,
        createdAt: observationData.createdAt,
      };
  
      // Assuming you want to set the observation data to a state or handle it otherwise
      setOneObservation(observation); // Replace this with your state setter or handling logic
  
      triggerNotification('Observation fetched successfully', 'success');
    } catch (error) {
      console.error('Error fetching observation:', error);
      triggerNotification('An error occurred while fetching observation', 'error');
    } finally {
      setIsFetchingObservationById(false);
    }
  };

  // fetch all observations only one image url
  const fetchDefaultViewObservations = async () => {
    try {
      const observationsRef = collection(firestore, 'hospitals', hospitalId, 'observations');
      const observationsSnapshot = await getDocs(observationsRef);
      const observationsData: ObservationDefaultView[] = [];
  
      for (const doc of observationsSnapshot.docs) {
        const observationData = doc.data() as Observation;
        const observation: ObservationDefaultView = {
          id: observationData.id,
          imageUrl: observationData.imageUrls[0],
          updatedAt: observationData.updatedAt,
          createdAt: observationData.createdAt,
        };
        observationsData.push(observation);
      }
  
      setDefaultViewObservations(observationsData);
    } catch (error) {
      console.error('Error fetching observations:', error);
      triggerNotification('An error occurred while fetching observations', 'error');
    }
  };

  useEffect(() => {
    // fetchAllObservations();
    fetchDefaultViewObservations();
  }, [refetch]); // Make sure to include hospitalId in the dependency array

  // export interface Patient {
  //     id: string;
  //     name: string;
  //     birthYear: string;
  //     phoneNumber: string;
  // }
  // save user details to firestore under hospital collection with hospital id. patient id should be generated document id keep phone number empty if not provided
  const savePatientDetails = async () => {
    setSavingPatientDetails(true);
    try {
      const patientRef = await addDoc(collection(firestore, 'hospitals', hospitalId, 'patients'), {
        name: patientName,
        birthYear: patientBirthYear,
        phoneNumber: patientPhoneNumber,
      });
      setPatientId(patientRef.id);
      console.log('Patient details saved with ID:', patientRef.id);
      triggerNotification('Patient details saved successfully', 'success');
    } catch (error) {
      console.error('Error saving patient details:', error);
      triggerNotification('An error occurred while saving patient details', 'error');
    } finally {
      setSavingPatientDetails(false);
    }
  };

  // get patient details by patient id
  const fetchPatientDetails = async (patientId: string): Promise<Patient | undefined> => {
    try {
      const patientRef = doc(firestore, 'hospitals', hospitalId, 'patients', patientId);
      const patientSnapshot = await getDoc(patientRef);
  
      if (patientSnapshot.exists()) {
        const data = patientSnapshot.data() as Patient;
        return data;
      } else {
        console.warn('No such document!');
        triggerNotification('No patient data found for the provided ID', 'error');
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      triggerNotification('An error occurred while fetching patient details', 'error');
    }
    return undefined; // Explicitly return undefined in case of failure or non-existent document
  };

  // export interface Hospital {
  //     id: string;
  //     name: string;
  //     department: string;
  //     address: string;
  //     phone: string;
  //     email: string;
  // }
  // useEffect and fetch hospital details by hospital id
  const fetchHospitalDetails = async () => {
    try {
      const hospitalRef = doc(firestore, 'hospitals', hospitalId); // Reference to the specific document
      const hospitalSnapshot = await getDoc(hospitalRef); // Fetch the document snapshot

      if (hospitalSnapshot.exists()) { // Check if the document exists
        const hospitalData = hospitalSnapshot.data() as Hospital; // Get the document data and cast it to your type
        setHospitalData(hospitalData);
      } else {
        console.warn('No such document!');
        triggerNotification('No hospital data found for the provided ID', 'error');
      }
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      triggerNotification('An error occurred while fetching hospital details', 'error');
    }
  };

  useEffect(() => {
    fetchHospitalDetails();
  }, [refetchHospitalDetails]); // Make sure to include hospitalId in the dependency array

  // share report
  const shareReport = () => {};
  
  // Slider
  const ImageSlider = ({ images } : { images: any }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Function to go to the previous image
    const prevImage = () => {
      console.log('next image');
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    };

    // Function to go to the next image
    const nextImage = () => {
      console.log('next image');
      setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    };

    return (
      <div className="relative w-full flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={prevImage}
          className="hover:bg-[#151515] p-2 absolute left-0 ml-4 flex items-center justify-center w-8 h-8 rounded-full text-white cursor-pointer w-[24px] h-[24px] rounded-full shadow"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        {/* Image */}
        <div className="flex items-center justify-center w-full">
          {isSegmentingScans 
            ? loader()
            :
              <Image
              priority={true}
              src={images[currentIndex]}
              alt={`Observation Image ${currentIndex + 1}`}
              width={500}  // Adjust the width as needed
              height={300} // Adjust the height as needed
              className="rounded"
            />
          }
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextImage}
          className="hover:bg-[#151515] p-2 absolute right-0 mr-4 flex items-center justify-center w-8 h-8 rounded-full text-white cursor-pointer w-[24px] h-[24px] rounded-full shadow"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  // in default view we will show all observations
  const DefaultView = () => {
    return (
      <div className="flex flex-col items-center justify-center block">
        <div className="flex flex-row flex-wrap gap-8 items-center justify-center">
            {defaultViewObservations.map((obs, index) => (
              <div key={obs.imageUrl+index} className="flex flex-col justify-between gap-2">
                {/* show frist image */}
                <div className="flex items-center justify-center p-2 border border-[#a1a1aa] rounded-md">
                  <Image
                    priority={true}
                    src={obs.imageUrl}
                    alt={`Observation Image ${index + 1}`}
                    width={300}  // Adjust the width as needed
                    height={300} // Adjust the height as needed
                    className="rounded"
                  />
                </div>
              <button 
                disabled={isFetchingObservationById}
                onClick={() => {
                  // setExpandObservationIndex(obs.id);
                  setShowExpandedObservation(!showExpandedObservation);
                  fetchObservationById(obs.id);
                }} 
                className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                {!isFetchingObservationById 
                  ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faExpand} className="mr-2" />Expand</span>
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
              </button>
            </div>
            ))}
        </div>
    </div>
    );
  };

  // show expanded observation
  const ExpandedObservationView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[90%] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Observation details</p>
          <button
            onClick={() => setShowExpandedObservation(!showExpandedObservation)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {!isAddingScanAndPatient
                ? <FontAwesomeIcon icon={faClose} />
                : <span className='flex justify-center items-center text-black'>{loader()}</span>
              }
          </button>
        </div>
        <div className="flex flex-row p-4 gap-4 items-center justify-between">
          {/* show images as slider*/}
          <div className="w-1/2">
            <ImageSlider images={oneObservation} />
          </div>
          <div className="w-1/2">
            {/* show conclusion */}
            <div className="">
                <p className="text-md">Conclusion</p>
                <textarea
                  disabled={true}
                  value={oneObservation?.conclusionText || ''}
                  autoComplete="off"
                  id="conclusion1"
                  className="mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white resize-none"
                  rows={4} // Specify the number of rows (height) of the textarea
                />
            </div>
            {/* show observation details */}
            <div className="mt-[40px] flex flex-col gap-6 justify-between items-start">
              <div className="w-full">
                <p className="text-md">Quick info</p>
                <div className="mt-2 flex flex-row gap-2 items-center justify-center">
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Radiologist</p>
                    <input
                      disabled={true}
                      value={oneObservation?.radiologistName || ''}
                      autoComplete="off"
                        type="text"
                        id="radiologistName1"
                        placeholder="Enter your Patient ID"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Head Doctor:</p>
                    <input
                      disabled={true}
                      value={oneObservation?.headDoctorName || ''}
                      autoComplete="off"
                        type="text"
                        id="headDoctorName1"
                        placeholder="Enter your Patient ID"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                    </div>
                </div>
              </div>
              {/* show user details */}
              <div className="w-full">
                <p className="text-md">Patient info</p>
                <div className="mt-2 w-full flex flex-row gap-2 items-center justify-center">
                <div className="flex flex-col gap-1 items-start justify-start w-3/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Full Name:</p>
                  <input
                      disabled={true}
                      value={oneObservation?.patientDetails.name || ''}
                      autoComplete="off"
                        type="text"
                        id="fullName1"
                        placeholder="Enter your Patient ID"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Birth Year:</p>
                  <input
                    disabled={true}
                    value={oneObservation?.patientDetails.birthYear || ''}
                    autoComplete="off"
                      type="text"
                      id="birthYear1"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-2/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Phone Number:</p>
                  <input
                    disabled={true}
                    value={oneObservation?.patientDetails.phoneNumber || ''}
                    autoComplete="off"
                      type="text"
                      id="phoneNumber1"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                    </div>
                </div>
              </div>
            </div>
            {/* show action buttons */}
            <div className="flex flex-row gap-4 mt-[60px]"> 
              <button 
                    disabled={isApprovingObservation || isDeletingObservation}
                  onClick={() => {
                    handleDeleteObservation();
                  }} 
                  className={`bg-[#7f1d1d] text-black p-2 rounded-md w-full font-bold hover:bg-[#b91c1c]`}>
                  {!isApprovingObservation || !isDeletingObservation
                    ? <span className='flex justify-center items-center text-white'>Delete</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isApprovingObservation || isDeletingObservation}
                  onClick={() => {
                    handleApproveObservation();
                  }} 
                  className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e]`}>
                  {!isApprovingObservation || !isDeletingObservation
                    ? <span className='flex justify-center items-center text-white'>Approve</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const handleApproveObservation = async () => {
    setIsApprovingObservation(true);
    console.log('approving observation');
    // delay for 2 seconds
    setTimeout(() => {
      setIsApprovingObservation(false);
    }, 2000);
  };

  const handleDeleteObservation = async () => {
    setIsDeletingObservation(true);
    console.log('deleting observation');
    // delay for 2 seconds
    setTimeout(() => {
      setIsDeletingObservation(false);
    }, 2000);
  };

  const handleRegenerateConclusion = async () => {
    setIsRegeneratingConclusion(true);
    console.log('regenerating conclusion');
    await handleGenerateConclusion(segmentResult);
    setIsRegeneratingConclusion(false);
  };
  
  const handleSaveObservation = async () => {
    // setIsAddingScanAndPatient(true);
    setIsSavingObservation(true);
    
    // TODO: need to check again
    // // upload scans to firebase storage
    // await uploadScansToFirebaseStorage();
    // if (scanUrls.length === 0) {
    //   triggerNotification('Something went wrong on setScanUrls state', 'error');
    //   setIsSavingObservation(false);
    //   return
    // }

    // save patient details to firestore
    await savePatientDetails();
    if (patientId === '') {
      triggerNotification('Something went wrong on patientId state', 'error');
      setIsSavingObservation(false);
      return
    }
    // save observation to firestore
    if (await saveObservation()) {
        setIsSavingObservation(false);
        setShowExpandedConclusion(false);
        setShowPortalView(true);
        // re-fetch all observations
        setRefetch(!refetch);
        // initiliaze all states
        console.log("all states are initialized");
        setPatientName('');
        setPatientBirthYear('');
        setPatientPhoneNumber('');
        setScanUrls([]);
        setPatientId('');
        setConclusion('');
        setRadiologistName('');
    }
  };

  // show expanded conclusion
  const ExpandedConclusionView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[90%] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Generated conclusion</p>
          <button
            onClick={() => setShowExpandedConclusion(!showExpandedConclusion)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {!isAddingScanAndPatient
                ? <FontAwesomeIcon icon={faClose} />
                : <span className='flex justify-center items-center text-white'>{loader()}</span>
              }
          </button>
        </div>
        <div className="flex flex-row p-4 gap-4 items-center justify-between">
          {/* show images as slider*/}
          <div className="w-1/2">
            <ImageSlider images={scanUrls} />
          </div>
          <div className="w-1/2">
            {/* show conclusion */}
            <div className="">
                <p className="text-md">Conclusion</p>
                {(isGeneratingConclusion || isSegmentingScans)
                  ? loader() 
                  : (
                    <textarea
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)} // Append the last typed character
                      autoComplete="off"
                      id="conclusion"
                      className="mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white resize-none"
                      rows={4} // Specify the number of rows (height) of the textarea
                    />
                  )
                }
            </div>
            {/* show observation details */}
            <div className="mt-[40px] flex flex-col gap-6 justify-between items-start">
              <div className="w-full">
                <p className="text-md">Quick info <span className="text-[#a1a1aa] text-xs">(fill it out)</span></p>
                <div className="mt-2 flex flex-row gap-2 items-start justify-start">
                  <div className="flex flex-col gap-1 items-start justify-start w-1/2">
                    <p className="text-xs text-[#a1a1aa] block font-bold">Radiologist <span className="text-red-500">*</span></p>
                    <input
                      value={radiologistName}
                      onChange={(e) => setRadiologistName(e.target.value)}
                      autoComplete="off"
                        type="text"
                        id="radiologistName"
                        placeholder="Enter radiologist name"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white text-sm bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                </div>
              </div>
              {/* show user details */}
              <div className="w-full">
                <p className="text-md">Patient info</p>
                <div className="mt-2 w-full flex flex-row gap-2 items-center justify-center">
                <div className="flex flex-col gap-1 items-start justify-start w-3/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Full Name:</p>
                  <input
                      disabled={true}
                      value={patientName}
                      autoComplete="off"
                        type="text"
                        id="fullName"
                        placeholder="Enter your Patient ID"
                        className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                      />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-1/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Birth Year:</p>
                  <input
                    disabled={true}
                    value={patientBirthYear}
                    autoComplete="off"
                      type="text"
                      id="birthYear"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-start w-2/6">
                  <p className="text-xs text-[#a1a1aa] block font-bold">Phone Number:</p>
                  <input
                    disabled={true}
                    value={patientPhoneNumber}
                    autoComplete="off"
                      type="text"
                      id="phoneNumber"
                      placeholder="Enter your Patient ID"
                      className="w-2/3 mt-2 placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-sm text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                    </div>
                </div>
              </div>
            </div>
            {/* show action buttons */}
            <div className="flex flex-row gap-4 mt-[60px]"> 
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleDeleteObservation();
                  }} 
                  className={`bg-[#7f1d1d] text-black p-2 rounded-md w-full font-bold hover:bg-[#b91c1c]`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Delete</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleRegenerateConclusion();
                  }} 
                  className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Regenerate</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
              <button 
                    disabled={isRegeneratingConclusion || isDeletingObservation || radiologistName.trim() === '' || isSavingObservation || isSegmentingScans}
                  onClick={() => {
                    handleSaveObservation();
                  }} 
                  className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e] ${
                    radiologistName.trim() === '' ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}>
                  {(!isRegeneratingConclusion || !isDeletingObservation || !isSavingObservation || !isSegmentingScans)
                    ? <span className='flex justify-center items-center text-white'>Save</span>
                    : <span className='flex justify-center items-center text-white'>{loader()}</span>
                  }
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Append new files to the existing droppedFiles state onle if file was not already dropped
      if (droppedFiles.length === 3) {
        triggerNotification('You can only upload up to 3 files at a time', 'error');
        return;
      }
      const newFiles = Array.from(files).filter(file => !droppedFiles.some(f => f.name === file.name));
      setDroppedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    // Remove file by filtering out the clicked file
    setDroppedFiles((prevFiles) => prevFiles.filter(file => file.name !== fileName));
  };

  const handleSelectScansClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // Trigger the file input click programmatically
    }
  };


  const UploadImageView = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-40">
      <div className="w-[800px] bg-[#2e2e2e] rounded-md">
        {/* header */}
        <div className="flex flex-row justify-between border-b border-[#a1a1aa] p-4">
          <p className="text-md">Add patient & scans</p>
          <button
            onClick={() => setShowUploadImageView(!showUploadImageView)}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2`}>
              {!isAddingScanAndPatient
                ? <FontAwesomeIcon icon={faClose} />
                : <span className='flex justify-center items-center text-white'>{loader()}</span>
              }
          </button>
        </div>
        <div className="p-4">
          {/* workspace */}
          <div className="flex flex-row justify-between border border-[#a1a1aa] p-4 rounded-md">
            <p className="text-md">Workspace: <span className="text-md ml-[20px] text-[#aaaaaa]">{user?.fullName}'s workspace...</span></p>
            <button
              onClick={() => {}}
              className={`flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer`}>
                {!isAddingScanAndPatient
                  ? <FontAwesomeIcon icon={faChevronDown} />
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
            </button>
          </div>
          <div className="mt-[30px] flex flex-row justify-between gap-[40px]">
            {/* upload scans */}
            <div className="flex flex-col justify-between border border-[#a1a1aa] rounded-md w-1/2">
              <div className="flex items-center justify-center h-64 w-full">
                {/* Hidden file input */}
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef} // Attach ref to the input
                  id="file-upload"
                  onChange={handleFileChange}
                  multiple
                />

                {droppedFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer h-full w-full"
                      onClick={handleSelectScansClick} // Handle click to open file dialog
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FontAwesomeIcon icon={faFile} size="3x" />
                        <p className="mb-2 mt-2 text-sm text-gray-500">
                          <span className="font-semibold text-[#aaaaaa]">Drag & drop files</span>
                        </p>
                        <p className="text-xs text-[#aaaaaa]">(Only DICOM, PNG, JPEG files supported)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-row gap-4 items-center justify-center w-full overflow-auto">
                    <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
                      {droppedFiles.map((file) => (
                        <div key={file.name} className="flex flex-row gap-2 items-center justify-center">
                          <div className="flex flex-col items-start justify-start p-2 border border-[#a1a1aa] rounded-md">
                            <p className="text-xs text-white">
                              File name: <span className="text-[#aaaaaa]"><FontAwesomeIcon icon={faPenNib} className="mr-1" />{file.name}</span>
                            </p>
                            <p className="text-xs text-white">
                              Series/Instance: <span className="text-[#aaaaaa]"><FontAwesomeIcon icon={faClone} className="mr-1" />1</span>
                            </p>
                            <p className="text-xs text-white">
                              Status: <span className="text-[#0f766e]"><FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Valid format</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(file.name)}
                            className="flex items-center justify-center w-[24px] h-[24px] rounded-full shadow cursor-pointer hover:bg-[#151515] p-2 mt-2"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* "Select Scan(s)" button to trigger file input */}
              <button
                disabled={droppedFiles.length === 3}
                onClick={handleSelectScansClick} // Use the ref click handler
                className={`bg-[#a1a1aa] text-black p-2 rounded-md w-full font-bold hover:bg-[#f4f4f5] ${
                  droppedFiles.length === 3 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className='flex justify-center items-center text-black'>Select Scan(s)</span>
              </button>
            </div>
            {/* user info */}
            <div className="w-1/2">
              {/* Patient ID */}
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Patient ID
                </p>
                <input
                value={patientId}
                onChange={(e) => {
                  console.log(e.target.value)
                  setPatientId(e.target.value)
                }}
                autoComplete="off"
                  type="text"
                  name="id"
                  placeholder="Enter your Patient ID"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>

              {/* Full Name */}
              <div className="mb-4">
                <p className="block text-white text-xs font-bold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </p>
                <input
                value={patientName}
                onChange={(e) => {setPatientName(e.target.value)}}
                autoComplete="off"
                  type="text"
                  name="fullname"
                  placeholder="Enter first, middle and last name"
                  className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                />
              </div>

              {/* Age and Birth Gender */}
              <div className="flex mb-4">
                {/* Age */}
                <div className="w-1/3 pr-2">
                  <p className="block text-white text-xs font-bold mb-2">
                    Birth Year <span className="text-red-500">*</span>
                  </p>
                  <div className="flex items-center">
                    <input
                    value={patientBirthYear}
                    onChange={(e) => setPatientBirthYear(e.target.value)}
                    autoComplete="off"
                      type="text"
                      name="age"
                      placeholder="Birth year"
                      className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                    />
                  </div>
                </div>
                {/* Phone Number */}
                <div className="w-2/3 pl-2">
                  <p className="block text-white text-xs font-bold mb-2">
                    Phone Number
                  </p>
                  <input
                  value={patientPhoneNumber}
                  onChange={(e) => setPatientPhoneNumber(e.target.value)}
                    autoComplete="off"
                    type="text"
                    name="phone"
                    placeholder="Enter patient's phone number"
                    className="placeholder:text-[#aaaaaa] placeholder:text-sm w-full px-4 py-3 text-white bg-transparent rounded border border-[#a1a1aa] focus:outline-none focus:border-white"
                  />
                </div>
              </div>
              {/* Proceed */}
              <button 
                disabled={isAddingScanAndPatient || patientName === '' || patientBirthYear === '' || droppedFiles.length === 0}
                onClick={proceedWithScans} 
                className={`bg-[#134e4a] text-white p-2 rounded-md w-full font-bold ${ 
                  (isAddingScanAndPatient || patientName === '' || patientBirthYear === '' || droppedFiles.length === 0) ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#0f766e]'}`}>
                {!isAddingScanAndPatient 
                  ? <span className='flex justify-center items-center text-white'>Proceed</span>
                  : <span className='flex justify-center items-center text-white'>{loader()}</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  };

  const ReportView = () => {
return (
      <div className="flex flex-col items-center justify-center block">
        <div className="flex flex-row flex-wrap gap-8 items-center justify-start">
            {sampleData.map((obs, index) => (
              <div key={obs.imageUrl} className="flex flex-col justify-between gap-2">
                {/* show report pdf preview */}
                <div className="flex items-center justify-center p-2 border border-[#a1a1aa] rounded-md">
                  <Image
                  priority={true}
                    src={sampleData[0].imageUrl}
                    alt={`Observation Image ${sampleData[0].imageUrl}`}
                    width={300}  // Adjust the width as needed
                    height={300} // Adjust the height as needed
                    className="rounded"
                  />
                </div>
              <div className="flex flex-row gap-2">
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      // setExpandObservationIndex(obs.id);
                      setShowExpandedObservation(!showExpandedObservation);
                      // setIsFetchingObservationById(true);
                      // fetchObservationById(obs.id);
                    }} 
                    className={`bg-[#0c4a6e] text-black p-2 rounded-md w-full font-bold hover:bg-[#0369a1]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faExpand} className="mr-2" />Expand</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      // Trigger the print dialog
                      window.print();
                    }} 
                    className={`bg-[#a1a1aa] text-black p-2 rounded-md w-full font-bold hover:bg-[#f4f4f5]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-black'><FontAwesomeIcon icon={faPrint} className="mr-2" />Print</span>
                      : <span className='flex justify-center items-center text-black'>{loader()}</span>
                    }
                  </button>
                  <button 
                    disabled={isFetchingObservationById}
                    onClick={() => {
                      shareReport();
                    }} 
                    className={`bg-[#134e4a] text-black p-2 rounded-md w-full font-bold hover:bg-[#0f766e]`}>
                    {!isFetchingObservationById 
                      ? <span className='flex justify-center items-center text-white'><FontAwesomeIcon icon={faShare} className="mr-2" />Share</span>
                      : <span className='flex justify-center items-center text-white'>{loader()}</span>
                    }
                  </button>
                </div>
            </div>
            ))}
        </div>
    </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative text-white">
              {/* show notification */}
                {notification && (
                <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
                />
            )}
      {/* sidebar */}
      <aside className="absolute top-0 left-0 w-2/12 h-full bg-[#151515]">
        <div className="flex flex-col items-start justify-start h-full space-y-8">
            <div>
              <p className="mt-[50px] ml-[20px] text-[46px] font-bold">CoMed</p>
            </div>
          {/* navigations */}
          <div className="mt-[100px] ml-[20px] flex flex-col gap-4">
          <div>
              {/* <p className="text-sm text-[#eeeeee]">Navigation</p> */}
            </div>
            {/* show upload image view */}
            <div>
              <button 
                onClick={handleShowUploadImageView}
                className="text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center"
              ><FontAwesomeIcon icon={faAdd} className="mr-2"/> Upload Scan(s)</button>
            </div>
            {/* show portal view */}
            <div>
              <button 
                onClick={handleShowPortalView}
                className="text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center"
              ><FontAwesomeIcon icon={faCompass} className="mr-2"/>Observations</button>
            </div>
            {/* show report view */}
            <div>
              <button 
                onClick={handleShowReportView}
                className="text-md cursor-pointer w-full hover:underline border border-white rounded-md px-4 py-4 flex items-center"
              ><FontAwesomeIcon icon={faFile} className="mr-2"/>Reports</button>
            </div>
          </div>
          {/* account settings */}
          <div className="absolute bottom-[20px] left-[20px]">
          <SignedIn>
        <UserButton />
      </SignedIn>
          </div>
        </div>
      </aside>
      {/* main playground */}
      <aside className="absolute top-0 right-0 w-10/12 h-full overflow-auto">
        <div className="flex flex-col items-center justify-center p-8">
          {!showUploadImageView && !showPortalView && !showReportView && (
              <div className="h-10/12">
              <DefaultView />
            </div>
            )}
            {/* show expand conclusion view */}
            {showExpandedConclusion && (
              <ExpandedConclusionView />
            )}
            {/* show expanded view */}
            {showExpandedObservation && (
              <ExpandedObservationView />
            )}
          {/* on show upload image view */}
          {showUploadImageView && (
            <div className="h-10/12">
              <UploadImageView />
            </div>
            )}
          {/* on show portal view */}
          {showPortalView && (
            <div className="h-10/12">
              <DefaultView />
            </div>
            )}
          {/* on show report view */}
          {showReportView && (
            <div className="h-10/12">
              <ReportView />
            </div>
            )}
        </div>
      </aside>
      <div className="text-white">
      <SignedOut>
        <SignInButton />
      </SignedOut>
      </div>
    </main>
  );
}
