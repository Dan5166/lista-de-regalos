import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavLinks } from "./_components/NavLinks";

async function adminSignOut() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const rol = (session?.user as any)?.rol;
  if (!session?.user || (rol !== "SUPERADMIN" && rol !== "ADMIN")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-rose-50/40">
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Izquierda: logo + secciones */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-bold text-gray-900 text-sm flex items-center gap-1.5 shrink-0"
            >
              🎁 <span className="hidden sm:inline">Lista de regalos</span>
            </Link>
            <div className="h-5 w-px bg-gray-200 shrink-0" />
            <NavLinks rol={rol} />
          </div>

          {/* Derecha: usuario + logout */}
          <div className="flex items-center gap-4">
            <Link
              href="/perfil"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block truncate max-w-40"
            >
              {session.user.name}
            </Link>
            <form action={adminSignOut}>
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer whitespace-nowrap">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
