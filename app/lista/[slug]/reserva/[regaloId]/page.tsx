import { auth } from "@/lib/auth";
import { Lista, Regalo, Usuario } from "@/lib/entities";
import { reasignarRegalo, liberarRegalo } from "../../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function GestionarReservaPage({
  params,
}: {
  params: Promise<{ slug: string; regaloId: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as any).rol !== "ADMIN") {
    redirect("/login");
  }

  const { slug, regaloId } = await params;

  const [{ data: lista }, { data: regalo }, { data: usuarios }] =
    await Promise.all([
      Lista.get({ slug }).go(),
      Regalo.get({ listaSlug: slug, regaloId }).go(),
      Usuario.scan.go(),
    ]);

  if (!lista || !regalo) redirect(`/lista/${slug}`);

  const usuariosOrdenados = [...usuarios].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );

  async function asignar(formData: FormData) {
    "use server";
    await reasignarRegalo(slug, regaloId, formData);
    redirect(`/lista/${slug}`);
  }

  async function quitar() {
    "use server";
    await liberarRegalo(slug, regaloId);
    redirect(`/lista/${slug}`);
  }

  return (
    <div className="min-h-screen bg-rose-50/40">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/lista/${slug}`}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold text-gray-900">Gestionar reserva</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Info del regalo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Regalo
            </p>
            <p className="font-semibold text-gray-900">{regalo.nombre}</p>
            {regalo.descripcion && (
              <p className="text-sm text-gray-500 mt-0.5">{regalo.descripcion}</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Estado actual
            </p>
            {regalo.compradoPorId ? (
              <p className="text-sm font-medium text-gray-700">
                Tomado por{" "}
                <span className="text-emerald-600">{regalo.compradoPorNombre}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">Sin reserva</p>
            )}
          </div>
        </div>

        {/* Asignar a un usuario */}
        <form
          action={asignar}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-semibold text-gray-900">Asignar a un usuario</h2>
          <select
            name="username"
            defaultValue={regalo.compradoPorId ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          >
            {usuariosOrdenados.map((u) => (
              <option key={u.username} value={u.username}>
                {u.nombre} (@{u.username})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
          >
            Guardar asignación
          </button>
        </form>

        {/* Quitar reserva */}
        {regalo.compradoPorId && (
          <form action={quitar}>
            <button
              type="submit"
              className="w-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 font-medium rounded-xl py-3 text-sm transition-colors cursor-pointer"
            >
              Quitar reserva — dejar sin tomar
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
