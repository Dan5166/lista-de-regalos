import { Lista, Usuario } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { eliminarUsuario, cambiarListaUsuario } from "./actions";
import { SearchAndSort } from "../_components/SearchAndSort";
import { Pagination } from "../_components/Pagination";
import Link from "next/link";
import { Suspense } from "react";

const PER_PAGE = 15;

const ROL_LABEL: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  CUMPLEANERO: "Cumpleañero",
  INVITADO: "Invitado",
};

const ROL_COLOR: Record<string, string> = {
  SUPERADMIN: "bg-rose-100 text-rose-700",
  ADMIN: "bg-violet-100 text-violet-700",
  CUMPLEANERO: "bg-amber-100 text-amber-700",
  INVITADO: "bg-gray-100 text-gray-500",
};

const ROL_ORDER: Record<string, number> = {
  SUPERADMIN: 0, ADMIN: 1, CUMPLEANERO: 2, INVITADO: 3,
};

const SORT_OPTIONS = [
  { value: "nombre_asc", label: "Nombre A→Z" },
  { value: "nombre_desc", label: "Nombre Z→A" },
  { value: "rol", label: "Por rol" },
  { value: "lista", label: "Por lista" },
];

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; lista?: string }>;
}) {
  const { q = "", sort = "nombre_asc", page: pageStr = "1", lista: listaFiltro = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr));

  const session = await auth();
  const rol = (session?.user as any)?.rol;
  const esSuperAdmin = rol === "SUPERADMIN";
  const miListaSlug = (session?.user as any)?.listaSlug as string | undefined;
  const sesionUsername = (session?.user as any)?.username;

  const { data: todosUsuarios } = await Usuario.scan.go();
  const listas = esSuperAdmin ? (await Lista.scan.go()).data : [];
  listas.sort((a, b) => a.titulo.localeCompare(b.titulo));
  const listaPorSlug = Object.fromEntries(listas.map((l) => [l.slug, l]));

  const listaSeleccionada = listaFiltro ? listaPorSlug[listaFiltro] : null;

  // Base: filtrar por rol o por lista contextual
  let usuarios = esSuperAdmin
    ? todosUsuarios
    : todosUsuarios.filter((u) => u.listaSlug === miListaSlug);

  // Si hay filtro de lista activo, mostrar solo usuarios de esa lista
  if (esSuperAdmin && listaFiltro) {
    usuarios = usuarios.filter((u) => u.listaSlug === listaFiltro);
  }

  // Búsqueda
  if (q) {
    const qLower = q.toLowerCase();
    usuarios = usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(qLower) ||
        u.username.toLowerCase().includes(qLower) ||
        (u.listaSlug && listaPorSlug[u.listaSlug]?.titulo.toLowerCase().includes(qLower))
    );
  }

  // Ordenamiento
  usuarios = [...usuarios].sort((a, b) => {
    switch (sort) {
      case "nombre_desc": return b.nombre.localeCompare(a.nombre);
      case "rol": return (ROL_ORDER[a.rol] ?? 9) - (ROL_ORDER[b.rol] ?? 9);
      case "lista": {
        const ta = listaPorSlug[a.listaSlug ?? ""]?.titulo ?? "";
        const tb = listaPorSlug[b.listaSlug ?? ""]?.titulo ?? "";
        return ta.localeCompare(tb) || a.nombre.localeCompare(b.nombre);
      }
      default: return a.nombre.localeCompare(b.nombre);
    }
  });

  const total = usuarios.length;
  const paginated = usuarios.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Usuarios sin lista para el panel de asignación rápida
  const usuariosSinLista = esSuperAdmin
    ? todosUsuarios
        .filter((u) => !u.listaSlug && u.rol !== "SUPERADMIN")
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    : [];

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {listaSeleccionada ? (
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href="/admin/usuarios"
                  className="text-gray-400 hover:text-gray-600 transition-colors text-sm shrink-0"
                >
                  ← Todos
                </Link>
                <span className="text-gray-300">/</span>
                <h1 className="font-bold text-gray-900 truncate">{listaSeleccionada.titulo}</h1>
              </div>
            ) : (
              <h1 className="font-bold text-gray-900">Usuarios</h1>
            )}
            <span className="text-sm text-gray-400 shrink-0">{total}</span>
          </div>
          <Link
            href={`/admin/usuarios/nuevo${listaFiltro ? `?lista=${listaFiltro}` : ""}`}
            className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors shrink-0"
          >
            + Nuevo usuario
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Panel de asignación rápida cuando hay lista seleccionada */}
        {esSuperAdmin && listaSeleccionada && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-violet-800">
              Asignar usuario a <span className="font-bold">{listaSeleccionada.titulo}</span>
            </p>
            {usuariosSinLista.length > 0 ? (
              <form
                action={async (formData) => {
                  "use server";
                  await cambiarListaUsuario(formData.get("username") as string, formData);
                }}
                className="flex gap-2"
              >
                <input type="hidden" name="listaSlug" value={listaFiltro} />
                <select
                  name="username"
                  className="flex-1 text-sm border border-violet-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="">— Seleccioná un usuario sin lista —</option>
                  {usuariosSinLista.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.nombre} · {ROL_LABEL[u.rol] ?? u.rol}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="text-sm bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer shrink-0"
                >
                  Asignar
                </button>
              </form>
            ) : (
              <p className="text-sm text-violet-600">Todos los usuarios ya tienen una lista asignada.</p>
            )}
          </div>
        )}

        <Suspense>
          <SearchAndSort
            sortOptions={SORT_OPTIONS}
            defaultSort="nombre_asc"
            placeholder="Buscar por nombre, usuario o lista..."
          />
        </Suspense>

        {paginated.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <p className="text-4xl">👤</p>
            <p className="text-sm">
              {q
                ? "Sin resultados para esa búsqueda."
                : listaSeleccionada
                ? "Esta lista no tiene usuarios asignados todavía."
                : "No hay usuarios todavía."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {paginated.map((usuario) => {
              const esSesionActual = usuario.username === sesionUsername;

              return (
                <li
                  key={usuario.username}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-sm uppercase select-none">
                      {usuario.nombre[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{usuario.nombre}</p>
                        <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${ROL_COLOR[usuario.rol] ?? "bg-gray-100 text-gray-500"}`}>
                          {ROL_LABEL[usuario.rol] ?? usuario.rol}
                        </span>
                        {esSesionActual && (
                          <span className="shrink-0 text-xs text-gray-400">(Tú)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">@{usuario.username}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <Link
                        href={`/admin/usuarios/${usuario.username}/editar`}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Editar
                      </Link>
                      {!esSesionActual && (
                        <form
                          action={async () => {
                            "use server";
                            await eliminarUsuario(usuario.username);
                          }}
                        >
                          <button className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                            Eliminar
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Asignación de lista inline (solo superadmin, no superadmins) */}
                  {esSuperAdmin && usuario.rol !== "SUPERADMIN" && (
                    <div className="mt-2.5 ml-14">
                      <form
                        action={async (formData) => {
                          "use server";
                          await cambiarListaUsuario(usuario.username, formData);
                        }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs text-gray-400 shrink-0">Cumpleaños:</span>
                        <select
                          name="listaSlug"
                          defaultValue={usuario.listaSlug ?? ""}
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                        >
                          <option value="">— Sin asignar —</option>
                          {listas.map((l) => (
                            <option key={l.slug} value={l.slug}>
                              {l.titulo}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg px-3 py-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          Guardar
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Suspense>
          <Pagination total={total} page={page} perPage={PER_PAGE} />
        </Suspense>
      </main>
    </>
  );
}
