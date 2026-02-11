"use client";

import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import Button from "@/components/UI/Button";

interface LoginProps {
  handleLogin: (name: string, password: string) => void;
}

export function Login({ handleLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const validateForm = () => {
    if (!username || !password) {
      toast.error("Please enter username and password.");
      return false;
    }
    return true;
  };
  const handleButtonClick = () => {
    if (validateForm()) {
      handleLogin(username, password);
    }
  };
  return (
    <>
      <h1 className="max-w-lg text-3xl pt-16 font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
        👋 Welcome to the chat application!
      </h1>
      <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Please enter your name and consent to start the chat.
      </p>
      <div className="flex flex-col gap-4 text-base font-medium w-full items-start">
        <ToastContainer />
        <input
          type="text"
          placeholder="Username"
          id="username"
          maxLength={20}
          className="w-sm p-2 rounded-md border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={username}
          onChange={handleUsernameChange}
        />
        <input
          type="password"
          placeholder="Password"
          id="password"
          maxLength={20}
          className="w-sm p-2 rounded-md border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={handlePasswordChange}
        />

        <Button variant="primary" onClick={handleButtonClick}>
          Start Chat
        </Button>

        <div className="text-zinc-500 dark:text-zinc-400 text-xs mt-4">
          <span className="font-bold">Disclaimer:</span> This chat is for
          informational purposes only. The AI is not a substitute for
          professional advice.
        </div>
      </div>
    </>
  );
}
