import { Lista } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { crearUsuario } from "../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NuevoUsuarioPage() {
  const session = await auth();
  const rol = (session?.user as any)?.rol;
  const esSuperAdmin = rol === "SUPERADMIN";

  const listas = esSuperAdmin ? (await Lista.scan.go()).data : [];
  listas.sort((a, b) => a.titulo.localeCompare(b.titulo));

  async function action(formData: FormData) {
    "use server";
    await crearUsuario(formData);
    redirect("/admin/usuarios");
  }

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/admin/usuarios"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold text-gray-900">Nuevo usuario</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form
          action={action}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              required
              placeholder="ej. María García"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Usuario <span className="text-red-400">*</span>
            </label>
            <input
              name="username"
              required
              placeholder="ej. maria"
              autoComplete="off"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1">Sin espacios. No se puede cambiar después.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña <span className="text-red-400">*</span>
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
            <select
              name="rol"
              defaultValue="INVITADO"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            >
              <option value="INVITADO">Invitado — puede reservar regalos</option>
              <option value="CUMPLEANERO">Cumpleañero — gestiona la lista, no ve quién compra</option>
              {esSuperAdmin && (
                <>
                  <option value="ADMIN">Admin — gestiona su lista y sus usuarios</option>
                  <option value="SUPERADMIN">Superadmin — acceso global</option>
                </>
              )}
            </select>
          </div>

          {esSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lista asociada{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                name="listaSlug"
                defaultValue=""
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              >
                <option value="">— Sin lista —</option>
                {listas.map((l) => (
                  <option key={l.slug} value={l.slug}>
                    {l.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/usuarios"
              className="flex-1 text-center border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
            >
              Crear usuario
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
