import { redirect } from "next/navigation";

export default function EditJobRedirect() {
  redirect("/dashboard/jobs");
}
