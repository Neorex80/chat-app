// Import Firebase SDK
import { db } from "./firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * Create a new chat room
 * @param {string} name - Name of the chat room
 * @param {string} createdBy - User ID of the creator
 * @returns {Promise}
 */
export const createChatRoom = async (name, createdBy) => {
  if (!name.trim() || !createdBy) throw new Error("Invalid room details");
  return await addDoc(collection(db, "chatrooms"), {
    name,
    createdBy,
    createdAt: serverTimestamp(),
  });
};

/**
 * Fetch all chat rooms
 * @param {function} callback - Function to handle the chat rooms data
 * @returns {function} Unsubscribe function for real-time updates
 */
export const fetchChatRooms = (callback) => {
  const roomsQuery = query(collection(db, "chatrooms"), orderBy("createdAt", "desc"));
  return onSnapshot(roomsQuery, (snapshot) => {
    const rooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(rooms);
  });
};

/**
 * Fetch messages for a specific room
 * @param {string} roomId - Chat room ID
 * @param {function} callback - Function to handle the messages data
 * @returns {function} Unsubscribe function for real-time updates
 */
export const fetchMessages = (roomId, callback) => {
  if (!roomId) throw new Error("Room ID is required");
  const messagesQuery = query(
    collection(db, "messages"),
    where("roomId", "==", roomId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
};

/**
 * Send a new message to a chat room
 * @param {string} text - Message content
 * @param {string} roomId - Chat room ID
 * @param {string} userId - User ID of the sender
 * @param {string} userName - Display name of the sender
 * @returns {Promise}
 */
export const sendMessage = async (text, roomId, userId, userName) => {
  if (!text.trim() || !roomId || !userId || !userName) {
    throw new Error("Invalid message details");
  }
  return await addDoc(collection(db, "messages"), {
    text,
    roomId,
    userId,
    userName,
    createdAt: serverTimestamp(),
  });
};

/**
 * Delete a chat room
 * @param {string} roomId - Chat room ID
 * @returns {Promise}
 */
export const deleteChatRoom = async (roomId) => {
  if (!roomId) throw new Error("Room ID is required");
  const roomRef = doc(db, "chatrooms", roomId);
  return await deleteDoc(roomRef);
};

/**
 * Update a chat room's name
 * @param {string} roomId - Chat room ID
 * @param {string} newName - New name for the chat room
 * @returns {Promise}
 */
export const updateChatRoom = async (roomId, newName) => {
  if (!roomId || !newName.trim()) throw new Error("Invalid room details");
  const roomRef = doc(db, "chatrooms", roomId);
  return await updateDoc(roomRef, { name: newName });
};

/**
 * Mark a user's status as offline or update last seen
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update (e.g., { status: "offline", lastSeen: serverTimestamp() })
 * @returns {Promise}
 */
export const updateUserStatus = async (userId, updates) => {
  if (!userId || !updates) throw new Error("Invalid user details");
  const userRef = doc(db, "users", userId);
  return await updateDoc(userRef, updates);
};
