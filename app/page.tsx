import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const rol = (session?.user as any)?.rol;
  const esAdmin = rol === "ADMIN" || rol === "SUPERADMIN";
  const esCumpleanero = rol === "CUMPLEANERO";

  return (
    <div className="min-h-screen bg-rose-50/40 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-5xl mb-4">🎁</p>
          <h1 className="text-3xl font-bold text-gray-900">Lista de regalos</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Coordina quién regala qué, sin spoilers
          </p>
        </div>

        {session?.user ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-gray-700">
              Hola,{" "}
              <span className="font-semibold">{session.user.name}</span> 👋
            </p>
            <p className="text-sm text-gray-500">
              {esCumpleanero
                ? "Abre el link de tu lista para gestionarla."
                : "Abre el link de la lista que te compartieron para ver los regalos."}
            </p>
            {esAdmin && (
              <Link
                href="/admin/listas"
                className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                Panel de administración →
              </Link>
            )}
            <Link
              href="/perfil"
              className="block w-full text-center border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg py-2 transition-colors"
            >
              Cambiar contraseña
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline">
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl px-8 py-3 transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
