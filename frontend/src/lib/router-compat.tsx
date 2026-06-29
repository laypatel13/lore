/**
 * Compatibility shim: maps the react-router-dom API used by the LORE pages
 * onto TanStack Router. Behavior is identical from the page's perspective —
 * no business logic changed.
 */
import {
  Link as TLink,
  useNavigate as tUseNavigate,
  useParams as tUseParams,
  useLocation as tUseLocation,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  children?: ReactNode;
};

export function Link({ to, children, ...rest }: LinkProps) {
  // TanStack Link accepts a plain path string at runtime; cast to bypass
  // the strict route-tree typing while keeping dynamic URLs working.
  return (
    <TLink to={to as never} {...(rest as Record<string, unknown>)}>
      {children}
    </TLink>
  );
}

export function useNavigate() {
  const navigate = tUseNavigate();
  return (to: string) => navigate({ to: to as never });
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return tUseParams({ strict: false }) as T;
}

export function useLocation() {
  return tUseLocation();
}
