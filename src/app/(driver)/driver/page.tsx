import { redirect } from "next/navigation";

// /driver → /driver/dashboard
export default function DriverIndexPage() {
  redirect("/driver/dashboard");
}