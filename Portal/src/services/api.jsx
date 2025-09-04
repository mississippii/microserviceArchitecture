import axios from "axios";

const BASE_URL = "http://localhost:8090/api/auth";

export const fetchStudent = async (studentId) => {
  try {
    const res = await axios.post(`${BASE_URL}/student/${studentId}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Student not found");
  }
};

export const fetchCandidates = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/candidate/findAll`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to fetch candidates");
  }
};

export const submitVote = async (studentId, votes) => {
  try {
    const res = await axios.post(`${BASE_URL}/votes`, { studentId, votes });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Voting failed");
  }
};
