import { Lista, Regalo } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { reservarRegalo, liberarRegalo, eliminarRegalo, toggleEdicion } from "../actions";
import { Countdown } from "../_components/Countdown";
import Link from "next/link";

export default async function ListaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const { data: lista } = await Lista.get({ slug }).go();
  if (!lista) {
    return (
      <div className="min-h-screen bg-rose-50/40 flex items-center justify-center">
        <p className="text-gray-400">Lista no encontrada.</p>
      </div>
    );
  }

  const { data: regalos } = await Regalo.query.primary({ listaSlug: slug }).go();
  regalos.sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0));

  const rol = (session?.user as any)?.rol;
  const listaSlugUsuario = (session?.user as any)?.listaSlug;
  const esAdmin = rol === "SUPERADMIN" || (rol === "ADMIN" && listaSlugUsuario === slug);
  const esCumpleanero = rol === "CUMPLEANERO";
  const puedeGestionar = esAdmin || esCumpleanero;
  const usuarioId = (session?.user as any)?.id;

  const total = regalos.length;
  const tomados = regalos.filter((r) => r.compradoPorId).length;
  const disponibles = total - tomados;

  return (
    <div className="min-h-screen bg-rose-50/40">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="font-bold text-gray-900 truncate">{lista.titulo}</h1>
          {session?.user ? (
            <Link
              href="/perfil"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0"
            >
              Hola,{" "}
              <span className="font-medium text-gray-700">
                {session.user.name}
              </span>{" "}
              👋
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-violet-600 hover:text-violet-700 shrink-0"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Description + summary */}
        <div className="text-center space-y-3">
          {lista.fecha && <Countdown fecha={lista.fecha} />}
          {lista.descripcion && (
            <p className="text-gray-600">{lista.descripcion}</p>
          )}
          {total > 0 && (
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-sm">
              <span className="text-gray-400">Disponibles:</span>
              <span
                className={`font-semibold ${
                  disponibles > 0 ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {disponibles} de {total}
              </span>
            </div>
          )}
        </div>

        {/* Gestor: toggle bloqueo + agregar */}
        {puedeGestionar && (
          <div className="flex items-center justify-between gap-3">
            {esAdmin && (
              <form
                action={async () => {
                  "use server";
                  await toggleEdicion(slug);
                }}
              >
                <button
                  type="submit"
                  className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors cursor-pointer ${
                    lista.edicionBloqueada
                      ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {lista.edicionBloqueada ? "🔓 Desbloquear edición" : "🔒 Bloquear edición"}
                </button>
              </form>
            )}
            {(esAdmin || !lista.edicionBloqueada) && (
              <Link
                href={`/lista/${slug}/nuevo`}
                className="ml-auto inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                + Agregar regalo
              </Link>
            )}
          </div>
        )}

        {/* Lista de regalos */}
        {regalos.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <p className="text-4xl">🎁</p>
            <p className="text-sm">No hay regalos en esta lista todavía.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {regalos.map((regalo) => {
              const comprado = !!regalo.compradoPorId;
              const compradoPorMi = regalo.compradoPorId === usuarioId;
              const altaPrioridad = (regalo.prioridad ?? 0) >= 7;

              return (
                <li
                  key={regalo.regaloId}
                  className={`rounded-xl border p-4 transition-shadow ${
                    comprado
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {regalo.imagenUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={regalo.imagenUrl}
                        alt={regalo.nombre}
                        referrerPolicy="no-referrer"
                        className={`shrink-0 w-16 h-16 object-cover rounded-lg border border-gray-100 ${
                          comprado ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    )}

                    {/* Info del regalo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p
                          className={`font-semibold ${
                            comprado
                              ? "line-through text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {regalo.nombre}
                        </p>
                        {altaPrioridad && !comprado && (
                          <span className="shrink-0 text-xs bg-amber-100 text-amber-700 font-medium rounded-full px-2 py-0.5">
                            ⭐ Prioritario
                          </span>
                        )}
                      </div>
                      {regalo.descripcion && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {regalo.descripcion}
                        </p>
                      )}
                      {regalo.link && (
                        <a
                          href={regalo.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Ver en tienda →
                        </a>
                      )}
                      {comprado && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span className="text-emerald-500">✓</span>
                          {esAdmin
                            ? `Tomado por ${regalo.compradoPorNombre}`
                            : compradoPorMi
                            ? "Tomado por ti"
                            : "Ya fue tomado por alguien"}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 items-end justify-start shrink-0">
                      {!session?.user ? (
                        !comprado && (
                          <Link
                            href="/login"
                            className="text-xs text-gray-400 hover:text-violet-600 transition-colors whitespace-nowrap"
                          >
                            Iniciá sesión para marcar
                          </Link>
                        )
                      ) : comprado ? (
                        (compradoPorMi || esAdmin) && (
                          <form
                            action={async () => {
                              "use server";
                              await liberarRegalo(slug, regalo.regaloId);
                            }}
                          >
                            <button className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors cursor-pointer">
                              Desmarcar
                            </button>
                          </form>
                        )
                      ) : !esCumpleanero ? (
                        <form
                          action={async () => {
                            "use server";
                            await reservarRegalo(slug, regalo.regaloId);
                          }}
                        >
                          <button className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap cursor-pointer">
                            Ya lo compré
                          </button>
                        </form>
                      ) : null}

                      {(esAdmin || (esCumpleanero && !comprado && !lista.edicionBloqueada)) && (
                        <Link
                          href={`/lista/${slug}/editar/${regalo.regaloId}`}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Editar
                        </Link>
                      )}
                      {esAdmin && (
                        <form
                          action={async () => {
                            "use server";
                            await eliminarRegalo(slug, regalo.regaloId);
                          }}
                        >
                          <button className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                            Eliminar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* CTA para usuarios no logueados */}
        {!session?.user && total > 0 && (
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <Link
                href="/login"
                className="font-medium text-violet-600 hover:underline"
              >
                Iniciá sesión
              </Link>{" "}
              para marcar los regalos que vas a comprar
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
