import { Lista, Usuario } from "@/lib/entities";
import { asignarUsuarioALista, desasignarUsuario } from "../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";

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

export default async function UsuariosDeListaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const { q = "" } = await searchParams;

  const { data: lista } = await Lista.get({ slug }).go();
  if (!lista) redirect("/admin/listas");

  const { data: todosUsuarios } = await Usuario.scan.go();
  const usuarios = todosUsuarios
    .filter((u) => u.rol !== "SUPERADMIN")
    .filter((u) =>
      q
        ? u.nombre.toLowerCase().includes(q.toLowerCase()) ||
          u.username.toLowerCase().includes(q.toLowerCase())
        : true
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const enEstaLista = usuarios.filter((u) => u.listaSlug === slug);
  const sinLista = usuarios.filter((u) => !u.listaSlug);
  const enOtraLista = usuarios.filter((u) => u.listaSlug && u.listaSlug !== slug);

  return (
    <>
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2 min-w-0">
          <Link
            href="/admin/listas"
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm shrink-0"
          >
            ← Listas
          </Link>
          <span className="text-gray-300">/</span>
          <p className="text-gray-500 text-sm truncate">{lista.titulo}</p>
          <span className="text-gray-300">/</span>
          <h1 className="font-bold text-gray-900 shrink-0">Usuarios</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Búsqueda */}
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o usuario..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          />
          {q && (
            <Link
              href={`/admin/listas/${slug}/usuarios`}
              className="text-sm px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </Link>
          )}
        </form>

        {/* En esta lista */}
        <Section
          titulo={`En este cumpleaños (${enEstaLista.length})`}
          vacio="Ningún usuario asignado todavía."
          color="green"
        >
          {enEstaLista.map((u) => (
            <UserRow
              key={u.username}
              usuario={u}
              badge={{ label: "Asignado", color: "bg-emerald-100 text-emerald-700" }}
              accion={
                <form
                  action={async () => {
                    "use server";
                    await desasignarUsuario(u.username);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs border border-gray-200 hover:border-red-200 hover:text-red-500 text-gray-400 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Quitar
                  </button>
                </form>
              }
            />
          ))}
        </Section>

        {/* Sin lista */}
        {sinLista.length > 0 && (
          <Section titulo={`Sin lista asignada (${sinLista.length})`} color="gray">
            {sinLista.map((u) => (
              <UserRow
                key={u.username}
                usuario={u}
                accion={
                  <form
                    action={async () => {
                      "use server";
                      await asignarUsuarioALista(slug, u.username);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      Asignar
                    </button>
                  </form>
                }
              />
            ))}
          </Section>
        )}

        {/* En otra lista */}
        {enOtraLista.length > 0 && (
          <Section titulo={`En otro cumpleaños (${enOtraLista.length})`} color="gray">
            {enOtraLista.map((u) => (
              <UserRow
                key={u.username}
                usuario={u}
                badge={{ label: u.listaSlug!, color: "bg-gray-100 text-gray-500" }}
                accion={
                  <form
                    action={async () => {
                      "use server";
                      await asignarUsuarioALista(slug, u.username);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                    >
                      Mover aquí
                    </button>
                  </form>
                }
              />
            ))}
          </Section>
        )}
      </main>
    </>
  );
}

function Section({
  titulo,
  vacio,
  color,
  children,
}: {
  titulo: string;
  vacio?: string;
  color: "green" | "gray";
  children: React.ReactNode;
}) {
  const childArray = Array.isArray(children) ? children : [children];
  const hasItems = childArray.some(Boolean);

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
        {titulo}
      </h2>
      {hasItems ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        vacio && <p className="text-sm text-gray-400 px-1">{vacio}</p>
      )}
    </div>
  );
}

function UserRow({
  usuario,
  badge,
  accion,
}: {
  usuario: { username: string; nombre: string; rol: string };
  badge?: { label: string; color: string };
  accion: React.ReactNode;
}) {
  return (
    <li className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-violet-100 text-violet-600 font-bold flex items-center justify-center text-sm uppercase select-none">
        {usuario.nombre[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-900 text-sm truncate">{usuario.nombre}</p>
          <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${ROL_COLOR[usuario.rol] ?? "bg-gray-100 text-gray-500"}`}>
            {ROL_LABEL[usuario.rol] ?? usuario.rol}
          </span>
          {badge && (
            <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">@{usuario.username}</p>
      </div>
      <div className="shrink-0">{accion}</div>
    </li>
  );
}
