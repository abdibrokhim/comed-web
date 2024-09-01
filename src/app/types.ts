import { Timestamp } from "firebase/firestore";

export interface Patient {
    id: string;
    name: string;
    birthYear: string;
    phoneNumber: string;
}

export interface Observation {
    id: number;
    patientId: string;
    imageUrls: [string];
    conclusionText: string;
    radiologistName: string;
    headDoctorName: string;
    reportUrl: string;
    status: string;
    updatedAt: Timestamp;
    createdAt: Timestamp;
}

export interface ObservationDefaultView {
    id: number;
    imageUrl: string;
    updatedAt: Timestamp;
    createdAt: Timestamp;
}

export interface Hospital {
    id: string;
    name: string;
    department: string;
    address: string;
    phone: string;
    email: string;
}

export interface PatientObservation {
    id: string;
    patientId: string;
    patientDetails: Patient;
    imageUrls: [string];
    conclusionText: string;
    radiologistName: string;
    headDoctorName: string;
    reportUrl: string;
    status: string;
    updatedAt: Timestamp;
    createdAt: Timestamp;
}