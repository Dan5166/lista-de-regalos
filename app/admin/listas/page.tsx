import { Lista, Regalo } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { eliminarLista } from "./actions";
import { SearchAndSort } from "../_components/SearchAndSort";
import { Pagination } from "../_components/Pagination";
import Link from "next/link";
import { Suspense } from "react";

const PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: "titulo_asc", label: "Título A→Z" },
  { value: "titulo_desc", label: "Título Z→A" },
  { value: "tomados_desc", label: "Más regalos tomados" },
  { value: "disponibles_desc", label: "Más regalos disponibles" },
];

export default async function ListasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const { q = "", sort = "titulo_asc", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr));

  const session = await auth();
  const rol = (session?.user as any)?.rol;
  const esSuperAdmin = rol === "SUPERADMIN";
  const miListaSlug = (session?.user as any)?.listaSlug as string | undefined;

  let listas: Awaited<ReturnType<typeof Lista.scan.go>>["data"];
  if (esSuperAdmin) {
    ({ data: listas } = await Lista.scan.go());
  } else {
    const { data: lista } = miListaSlug
      ? await Lista.get({ slug: miListaSlug }).go()
      : { data: null };
    listas = lista ? [lista] : [];
  }

  const counts = await Promise.all(
    listas.map(async (l) => {
      const { data } = await Regalo.query.primary({ listaSlug: l.slug }).go();
      return {
        slug: l.slug,
        total: data.length,
        tomados: data.filter((r) => r.compradoPorId).length,
      };
    })
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.slug, c]));

  // Búsqueda
  let listasFiltradas = q
    ? listas.filter(
        (l) =>
          l.titulo.toLowerCase().includes(q.toLowerCase()) ||
          l.slug.toLowerCase().includes(q.toLowerCase()) ||
          l.descripcion?.toLowerCase().includes(q.toLowerCase())
      )
    : [...listas];

  // Ordenamiento
  listasFiltradas.sort((a, b) => {
    const ca = countMap[a.slug];
    const cb = countMap[b.slug];
    switch (sort) {
      case "titulo_desc": return b.titulo.localeCompare(a.titulo);
      case "tomados_desc": return (cb?.tomados ?? 0) - (ca?.tomados ?? 0);
      case "disponibles_desc":
        return ((cb?.total ?? 0) - (cb?.tomados ?? 0)) - ((ca?.total ?? 0) - (ca?.tomados ?? 0));
      default: return a.titulo.localeCompare(b.titulo);
    }
  });

  const total = listasFiltradas.length;
  const paginated = listasFiltradas.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900">
              {esSuperAdmin ? "Listas" : "Mi lista"}
            </h1>
            {esSuperAdmin && <span className="text-sm text-gray-400">{total}</span>}
          </div>
          {esSuperAdmin && (
            <Link
              href="/admin/listas/nuevo"
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              + Nueva lista
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {esSuperAdmin && (
          <Suspense>
            <SearchAndSort
              sortOptions={SORT_OPTIONS}
              defaultSort="titulo_asc"
              placeholder="Buscar por título, slug o descripción..."
            />
          </Suspense>
        )}

        {paginated.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <p className="text-4xl">🎁</p>
            <p className="text-sm">
              {q ? "Sin resultados para esa búsqueda." : esSuperAdmin ? "No hay listas todavía." : "No tenés una lista asignada."}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {paginated.map((lista) => {
              const c = countMap[lista.slug];

              return (
                <li key={lista.slug} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900">{lista.titulo}</p>
                        <span className="text-xs text-gray-400 font-mono">/{lista.slug}</span>
                        {lista.edicionBloqueada && (
                          <span className="text-xs bg-amber-100 text-amber-700 font-medium rounded-full px-2 py-0.5">
                            🔒 Bloqueada
                          </span>
                        )}
                      </div>
                      {lista.descripcion && (
                        <p className="text-sm text-gray-500 truncate">{lista.descripcion}</p>
                      )}
                      {c && (
                        <p className="text-xs text-gray-400 mt-1">
                          {c.tomados} de {c.total} regalos tomados
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <Link
                        href={`/lista/${lista.slug}`}
                        target="_blank"
                        className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                      >
                        Ver lista ↗
                      </Link>
                      {esSuperAdmin && (
                        <>
                              <Link
                            href={`/admin/listas/${lista.slug}/usuarios`}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Usuarios
                          </Link>
                          <Link
                            href={`/admin/listas/${lista.slug}/editar`}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            Editar
                          </Link>
                          <form
                            action={async () => {
                              "use server";
                              await eliminarLista(lista.slug);
                            }}
                          >
                            <button className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                              Eliminar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>

                </li>
              );
            })}
          </ul>
        )}

        {esSuperAdmin && (
          <Suspense>
            <Pagination total={total} page={page} perPage={PER_PAGE} />
          </Suspense>
        )}
      </main>
    </>
  );
}
