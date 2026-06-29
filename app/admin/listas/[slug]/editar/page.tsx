import { Lista } from "@/lib/entities";
import { editarLista } from "../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditarListaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: lista } = await Lista.get({ slug }).go();
  if (!lista) redirect("/admin/listas");

  async function action(formData: FormData) {
    "use server";
    await editarLista(slug, formData);
    redirect("/admin/listas");
  }

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/admin/listas"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold text-gray-900">Editar lista</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form
          action={action}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              name="titulo"
              required
              defaultValue={lista.titulo}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Slug
            </label>
            <div className="flex items-center border border-gray-100 rounded-lg bg-gray-50 overflow-hidden cursor-not-allowed">
              <span className="pl-3 text-gray-400 text-sm select-none">/lista/</span>
              <input
                value={lista.slug}
                disabled
                className="flex-1 px-1 py-2.5 text-gray-400 bg-transparent cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">El slug no se puede cambiar.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha del cumpleaños
            </label>
            <input
              name="fecha"
              type="date"
              defaultValue={lista.fecha ?? ""}
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
              defaultValue={lista.descripcion ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin/listas"
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
      </main>
    </>
  );
}
