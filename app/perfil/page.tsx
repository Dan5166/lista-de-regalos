import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CambiarContrasenaForm } from "./_components/Form";
import { cerrarSesion } from "./actions";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-rose-50/40">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Inicio
          </Link>
          <h1 className="font-semibold text-gray-900">Mi perfil</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Info del usuario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-lg uppercase select-none shrink-0">
            {session.user.name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-400">@{(session.user as any).username}</p>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Cambiar contraseña
          </h2>
          <CambiarContrasenaForm />
        </div>

        {/* Cerrar sesión */}
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-medium rounded-xl py-3 text-sm transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </form>
      </main>
    </div>
  );
}
