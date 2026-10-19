import { redirect } from "next/navigation";

/** The portal is the whole app: the bare address opens HQ (which sends anyone signed out to the login). */
export default function Home() {
  redirect("/hq");
}
