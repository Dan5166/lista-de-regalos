import { Lista, Regalo, Usuario } from "@/lib/entities";
import { editarRegalo, reasignarRegalo, liberarRegalo, asignarRegalo } from "../../../actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditarRegaloPage({
  params,
}: {
  params: Promise<{ slug: string; regaloId: string }>;
}) {
  const { slug, regaloId } = await params;

  const session = await auth();
  const rol = (session?.user as any)?.rol;
  const listaSlugUsuario = (session?.user as any)?.listaSlug;
  const esAdmin = rol === "SUPERADMIN" || (rol === "ADMIN" && listaSlugUsuario === slug);
  const esCumpleanero = rol === "CUMPLEANERO";
  const miUsername = (session?.user as any)?.username as string;

  const [{ data: lista }, { data: regalo }] = await Promise.all([
    Lista.get({ slug }).go(),
    Regalo.get({ listaSlug: slug, regaloId }).go(),
  ]);

  if (!lista) redirect("/");
  if (!regalo) redirect(`/lista/${slug}`);

  // Cumpleañero no puede editar un regalo ya tomado
  if (esCumpleanero && regalo.compradoPorId) redirect(`/lista/${slug}`);

  const necesitaUsuarios = esAdmin || (esCumpleanero && !regalo.compradoPorId);
  const todosUsuarios = necesitaUsuarios ? (await Usuario.scan.go()).data : [];
  const usuariosOrdenados = [...todosUsuarios].sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  );
  // Cumpleañero no puede asignarse a sí mismo
  const usuariosParaAsignar = esCumpleanero
    ? usuariosOrdenados.filter((u) => u.username !== miUsername)
    : usuariosOrdenados;

  async function guardar(formData: FormData) {
    "use server";
    await editarRegalo(slug, regaloId, formData);
    redirect(`/lista/${slug}`);
  }

  async function asignar(formData: FormData) {
    "use server";
    if (esAdmin) {
      await reasignarRegalo(slug, regaloId, formData);
    } else {
      await asignarRegalo(slug, regaloId, formData);
    }
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
          <h1 className="font-semibold text-gray-900">Editar regalo</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Campos del regalo */}
        <form
          action={guardar}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              required
              defaultValue={regalo.nombre}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={3}
              defaultValue={regalo.descripcion ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Link de tienda
            </label>
            <input
              name="link"
              type="url"
              defaultValue={regalo.link ?? ""}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Imagen{" "}
              <span className="text-gray-400 font-normal">
                (URL directa a la foto)
              </span>
            </label>
            <input
              name="imagenUrl"
              type="url"
              defaultValue={regalo.imagenUrl ?? ""}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Prioridad{" "}
              <span className="text-gray-400 font-normal">
                (0 = normal · 10 = muy importante)
              </span>
            </label>
            <input
              name="prioridad"
              type="number"
              min={0}
              max={10}
              defaultValue={regalo.prioridad ?? 0}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/lista/${slug}`}
              className="flex-1 text-center border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
            >
              Guardar cambios
            </button>
          </div>
        </form>

        {/* Reserva — admin (completo) o cumpleañero (solo asignar cuando libre) */}
        {(esAdmin || esCumpleanero) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Reserva</h2>
              {regalo.compradoPorId ? (
                <p className="text-sm text-gray-500">
                  {esAdmin ? (
                    <>
                      Tomado por{" "}
                      <span className="font-medium text-gray-700">
                        {regalo.compradoPorNombre}
                      </span>
                    </>
                  ) : (
                    "Ya fue tomado por alguien"
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin reserva activa</p>
              )}
            </div>

            {/* Asignar: admin siempre, cumpleañero solo si libre */}
            {(esAdmin || !regalo.compradoPorId) && (
              <form action={asignar} className="space-y-3">
                <select
                  name="username"
                  defaultValue={esAdmin ? (regalo.compradoPorId ?? "") : ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  {!esAdmin && (
                    <option value="">— Seleccioná quién lo compra —</option>
                  )}
                  {usuariosParaAsignar.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.nombre} (@{u.username})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
                >
                  {esAdmin && regalo.compradoPorId ? "Reasignar" : "Asignar"}
                </button>
              </form>
            )}

            {/* Quitar reserva: solo admin */}
            {esAdmin && regalo.compradoPorId && (
              <form action={quitar}>
                <button
                  type="submit"
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-500 font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
                >
                  Quitar reserva — dejar sin tomar
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
