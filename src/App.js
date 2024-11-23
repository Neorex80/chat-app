import React from "react";
import { auth } from "./firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import SignIn from "./components/signin";
import ChatRoom from "./components/ChatRoom";

const App = () => {
  const [user] = useAuthState(auth);

  return <div>{user ? <ChatRoom /> : <SignIn />}</div>;
};

export default App;
