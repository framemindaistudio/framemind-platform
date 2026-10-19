"use client";

/**
 * The react-router pieces the website pages were written with (Link, NavLink, useNavigate), backed by Next.js routing,
 * so the pages from the Figma export run unchanged.
 */
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Base = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> & { to: string };

export function Link({ to, className, children, ...rest }: Base & { className?: string; children?: ReactNode }) {
  return (
    <NextLink href={to} className={className} {...rest}>
      {children}
    </NextLink>
  );
}

export function NavLink({
  to,
  end,
  className,
  children,
  ...rest
}: Base & { end?: boolean; className?: string | ((s: { isActive: boolean }) => string); children?: ReactNode }) {
  const path = usePathname() ?? "/";
  const isActive = end || to === "/" ? path === to : path === to || path.startsWith(`${to}/`);
  return (
    <NextLink href={to} className={typeof className === "function" ? className({ isActive }) : className} aria-current={isActive ? "page" : undefined} {...rest}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.push(to);
}
