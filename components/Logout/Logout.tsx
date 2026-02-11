"use client";

/**
 * Logout button component
 * OnClick clear localStorage and redirect to /
 */
import { useRouter } from "next/navigation";
import { store_deleteAll } from "@/lib/client_store";
import { LogOut } from "lucide-react";
import Button from "../UI/Button";

export function Logout() {
  const router = useRouter();
  const handleOnClick = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error(error);
    }
    store_deleteAll();
    router.push(`/`);
  };
  return (
    <Button
      title="Logout"
      variant="secondary"
      size="small"
      onClick={handleOnClick}
      style={{ height: "30px" }}
    >
      <LogOut size={16} /> Logout
    </Button>
  );
}
