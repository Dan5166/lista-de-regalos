import { Lista } from "@/lib/entities";
import { crearRegalo } from "../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NuevoRegaloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: lista } = await Lista.get({ slug }).go();
  if (!lista) redirect("/");

  async function action(formData: FormData) {
    "use server";
    await crearRegalo(slug, formData);
    redirect(`/lista/${slug}`);
  }

  return (
    <div className="min-h-screen bg-rose-50/40">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/lista/${slug}`}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Volver
          </Link>
          <h1 className="font-semibold text-gray-900">Agregar regalo</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form
          action={action}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              required
              placeholder="ej. Auriculares Sony"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              name="descripcion"
              rows={3}
              placeholder="Detalles extra sobre el regalo..."
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
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Imagen{" "}
              <span className="text-gray-400 font-normal">(URL directa a la foto)</span>
            </label>
            <input
              name="imagenUrl"
              type="url"
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
              defaultValue={0}
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
              Guardar regalo
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
