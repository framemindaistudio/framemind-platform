"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/hq/data";
import type { Role } from "@/lib/hq/roles";

export interface LoginInfo {
  username: string;
  name: string;
  role: Role;
  passwordHashed: boolean;
}

/** Which deployment variables are set (booleans only; the API never returns values). */
export interface EnvInfo {
  sessionSecret: boolean;
  hqUsers: boolean;
  githubToken: boolean;
  githubRepo: boolean;
  siteUrl: boolean;
  contactEmail: boolean;
  contactPhone: boolean;
  whatsapp: boolean;
  deployHook: boolean;
}

export type SystemInfo = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; users: LoginInfo[]; env: EnvInfo };

/** Configured logins + env checks from GET /api/hq/users (founder / admin only). */
export function useSystemInfo(): SystemInfo {
  const [info, setInfo] = useState<SystemInfo>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    api<{ users: LoginInfo[]; env: EnvInfo }>("/api/hq/users")
      .then((j) => alive && setInfo({ status: "ready", users: j.users, env: j.env }))
      .catch((e) => alive && setInfo({ status: "error", message: e instanceof Error ? e.message : "Could not load system information" }));
    return () => {
      alive = false;
    };
  }, []);
  return info;
}
