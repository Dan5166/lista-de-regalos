"use server";

import { Regalo, Lista, Usuario } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ulid } from "ulid";

// --- Helpers ---

function esAdminDeLista(session: NonNullable<Awaited<ReturnType<typeof auth>>>, listaSlug: string) {
  const rol = (session.user as any)?.rol;
  return (
    rol === "SUPERADMIN" ||
    (rol === "ADMIN" && (session.user as any)?.listaSlug === listaSlug)
  );
}

async function requireGestorRegalos(listaSlug: string) {
  const session = await auth();
  const rol = (session?.user as any)?.rol;
  if (!session?.user) throw new Error("No autorizado");
  if (!esAdminDeLista(session, listaSlug) && rol !== "CUMPLEANERO") {
    throw new Error("No autorizado");
  }
  return session;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");
  return session;
}

// --- Bloqueo de edición (admin de la lista) ---

export async function toggleEdicion(listaSlug: string) {
  const session = await auth();
  if (!session?.user || !esAdminDeLista(session, listaSlug)) {
    throw new Error("No autorizado");
  }
  const { data: lista } = await Lista.get({ slug: listaSlug }).go();
  if (!lista) throw new Error("Lista no encontrada");
  await Lista.update({ slug: listaSlug })
    .set({ edicionBloqueada: !lista.edicionBloqueada })
    .go();
  revalidatePath(`/lista/${listaSlug}`);
}

// --- CRUD de regalos ---

async function checkEdicionPermitida(listaSlug: string, rol: string) {
  if (rol === "CUMPLEANERO") {
    const { data: lista } = await Lista.get({ slug: listaSlug }).go();
    if (lista?.edicionBloqueada) throw new Error("La edición de esta lista está bloqueada");
  }
}

export async function crearRegalo(listaSlug: string, formData: FormData) {
  const session = await requireGestorRegalos(listaSlug);
  await checkEdicionPermitida(listaSlug, (session.user as any)?.rol);

  const nombre = formData.get("nombre") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;
  const link = (formData.get("link") as string) || undefined;
  const imagenUrl = (formData.get("imagenUrl") as string) || undefined;
  const prioridad = Number(formData.get("prioridad") || 0);

  await Regalo.create({
    listaSlug,
    regaloId: ulid(),
    nombre,
    descripcion,
    link,
    imagenUrl,
    prioridad,
  }).go();

  revalidatePath(`/lista/${listaSlug}`);
}

export async function editarRegalo(
  listaSlug: string,
  regaloId: string,
  formData: FormData
) {
  const session = await requireGestorRegalos(listaSlug);
  const rol = (session.user as any)?.rol;

  await checkEdicionPermitida(listaSlug, rol);

  if (rol === "CUMPLEANERO") {
    const { data: regalo } = await Regalo.get({ listaSlug, regaloId }).go();
    if (regalo?.compradoPorId) throw new Error("No podés editar un regalo ya tomado");
  }

  const nombre = formData.get("nombre") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;
  const link = (formData.get("link") as string) || undefined;
  const imagenUrl = (formData.get("imagenUrl") as string) || undefined;
  const prioridad = Number(formData.get("prioridad") || 0);

  await Regalo.update({ listaSlug, regaloId })
    .set({ nombre, descripcion, link, imagenUrl, prioridad })
    .go();

  revalidatePath(`/lista/${listaSlug}`);
}

export async function eliminarRegalo(listaSlug: string, regaloId: string) {
  const session = await auth();
  if (!session?.user || !esAdminDeLista(session, listaSlug)) {
    throw new Error("No autorizado");
  }
  await Regalo.delete({ listaSlug, regaloId }).go();
  revalidatePath(`/lista/${listaSlug}`);
}

// --- Reservar / liberar regalo (cualquier usuario logueado excepto cumpleañero) ---

export async function reservarRegalo(listaSlug: string, regaloId: string) {
  const session = await requireUser();
  if ((session.user as any)?.rol === "CUMPLEANERO") throw new Error("No autorizado");
  const usuarioId = (session.user as any).id as string;
  const nombre = session.user!.name as string;

  await Regalo.update({ listaSlug, regaloId })
    .set({
      compradoPorId: usuarioId,
      compradoPorNombre: nombre,
      compradoAt: new Date().toISOString(),
    })
    .go();

  revalidatePath(`/lista/${listaSlug}`);
}

export async function liberarRegalo(listaSlug: string, regaloId: string) {
  const session = await requireUser();
  const usuarioId = (session.user as any).id as string;
  const esAdmin = esAdminDeLista(session, listaSlug);

  const { data: regalo } = await Regalo.get({ listaSlug, regaloId }).go();
  if (!regalo || !regalo.compradoPorId) return;

  if (regalo.compradoPorId !== usuarioId && !esAdmin) {
    throw new Error("No podés liberar un regalo que reservó otra persona");
  }

  await Regalo.update({ listaSlug, regaloId })
    .remove(["compradoPorId", "compradoPorNombre", "compradoAt"])
    .go();

  revalidatePath(`/lista/${listaSlug}`);
}

// --- Asignar regalo (cumpleañero: solo si libre y no a sí mismo) ---

export async function asignarRegalo(
  listaSlug: string,
  regaloId: string,
  formData: FormData
) {
  const session = await requireGestorRegalos(listaSlug);
  const rol = (session.user as any)?.rol;
  const miUsername = (session.user as any)?.username as string;

  const username = formData.get("username") as string;
  if (!username) throw new Error("Debe seleccionar un usuario");

  const { data: regalo } = await Regalo.get({ listaSlug, regaloId }).go();

  if (rol === "CUMPLEANERO") {
    if (regalo?.compradoPorId) throw new Error("Este regalo ya fue tomado");
    if (username === miUsername) throw new Error("No podés asignarte el regalo a vos mismo");
  }

  const { data: usuario } = await Usuario.get({ username }).go();
  if (!usuario) throw new Error("Usuario no encontrado");

  await Regalo.update({ listaSlug, regaloId })
    .set({
      compradoPorId: usuario.username,
      compradoPorNombre: usuario.nombre,
      compradoAt: new Date().toISOString(),
    })
    .go();

  revalidatePath(`/lista/${listaSlug}`);
}

// --- Reasignar reserva (admin de la lista) ---

export async function reasignarRegalo(
  listaSlug: string,
  regaloId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user || !esAdminDeLista(session, listaSlug)) {
    throw new Error("No autorizado");
  }

  const username = formData.get("username") as string;

  if (!username) {
    await Regalo.update({ listaSlug, regaloId })
      .remove(["compradoPorId", "compradoPorNombre", "compradoAt"])
      .go();
  } else {
    const { data: usuario } = await Usuario.get({ username }).go();
    if (!usuario) throw new Error("Usuario no encontrado");

    await Regalo.update({ listaSlug, regaloId })
      .set({
        compradoPorId: usuario.username,
        compradoPorNombre: usuario.nombre,
        compradoAt: new Date().toISOString(),
      })
      .go();
  }

  revalidatePath(`/lista/${listaSlug}`);
}
