"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import crest from "../../assets/crest.png";
import { QUIZ_VERSION } from "@/data/questions";

export default function LogoHomeLink() {
  const router = useRouter();
  return (
    <Link
      href="/"
      className="focus-ring mx-auto mb-5 block w-fit"
      aria-label="What Should I Play? — return to quiz start"
      onNavigate={(event) => {
        event.preventDefault();
        try { sessionStorage.removeItem(`wow-forever-quiz:${QUIZ_VERSION}`); }
        catch {}
        if (window.location.pathname === "/") window.location.reload();
        else router.push("/");
      }}
    >
      <Image src={crest} alt="" priority sizes="130px" className="h-[110px] w-auto sm:h-[130px]" />
    </Link>
  );
}
