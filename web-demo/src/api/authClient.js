import keycloak from "../lib/keycloak";
import { createAuthClient } from "./authClientFactory";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const client = createAuthClient({ keycloakClient: keycloak, apiUrl: API_URL });
export const getMe = client.getMe;
export const patchMe = client.patchMe;
export const createSession = client.createSession;
export const getSessions = client.getSessions;
export const analyzeVoice = client.analyzeVoice;
export const listAnalysisArtifacts = client.listAnalysisArtifacts;
export const getAnalysisArtifact = client.getAnalysisArtifact;
export const getTodayChallenge = client.getTodayChallenge;
export const saveGeneratedChallenge = client.saveGeneratedChallenge;
export const startChallenge = client.startChallenge;
export const completeChallengeExercise = client.completeChallengeExercise;
export const getChallengeStreak = client.getChallengeStreak;
export const chat = client.chat;
