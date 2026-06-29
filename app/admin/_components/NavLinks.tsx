"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUPERADMIN_LINKS = [
  { href: "/admin/listas", label: "Listas" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

const ADMIN_LINKS = [
  { href: "/admin/listas", label: "Mi lista" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export function NavLinks({ rol }: { rol: string }) {
  const pathname = usePathname();
  const links = rol === "SUPERADMIN" ? SUPERADMIN_LINKS : ADMIN_LINKS;

  return (
    <div className="flex items-center gap-1">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              active
                ? "bg-violet-50 text-violet-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
