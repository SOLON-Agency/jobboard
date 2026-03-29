import { redirect } from "next/navigation";

export default function NewJobRedirect() {
  redirect("/dashboard/jobs");
}
