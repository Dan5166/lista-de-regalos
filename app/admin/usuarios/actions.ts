"use server";

import { Usuario } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

async function requireAdminAccess() {
  const session = await auth();
  const rol = (session?.user as any)?.rol;
  if (!session?.user || (rol !== "SUPERADMIN" && rol !== "ADMIN")) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function crearUsuario(formData: FormData) {
  const session = await requireAdminAccess();
  const sesionRol = (session.user as any).rol as string;
  const esSuperAdmin = sesionRol === "SUPERADMIN";
  const miListaSlug = (session.user as any).listaSlug as string | null;

  const username = formData.get("username") as string;
  const nombre = formData.get("nombre") as string;
  const rolNuevo = formData.get("rol") as string;
  const password = formData.get("password") as string;
  const listaSlug = esSuperAdmin
    ? ((formData.get("listaSlug") as string) || undefined)
    : (miListaSlug ?? undefined);

  // ADMIN solo puede crear INVITADO o CUMPLEANERO en su lista
  if (!esSuperAdmin && (rolNuevo === "SUPERADMIN" || rolNuevo === "ADMIN")) {
    throw new Error("No autorizado");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Usuario.create({ username, nombre, rol: rolNuevo as any, passwordHash, listaSlug }).go();

  revalidatePath("/admin/usuarios");
}

export async function editarUsuario(username: string, formData: FormData) {
  const session = await requireAdminAccess();
  const sesionRol = (session.user as any).rol as string;
  const esSuperAdmin = sesionRol === "SUPERADMIN";
  const miListaSlug = (session.user as any).listaSlug as string | null;

  // ADMIN solo puede editar usuarios de su lista
  if (!esSuperAdmin) {
    const { data: target } = await Usuario.get({ username }).go();
    if (!target || target.listaSlug !== miListaSlug) throw new Error("No autorizado");
  }

  const nombre = formData.get("nombre") as string;
  const rolNuevo = formData.get("rol") as string;
  const password = formData.get("password") as string;
  const listaSlug = esSuperAdmin
    ? ((formData.get("listaSlug") as string) || undefined)
    : undefined;

  if (!esSuperAdmin && (rolNuevo === "SUPERADMIN" || rolNuevo === "ADMIN")) {
    throw new Error("No autorizado");
  }

  const updates: Record<string, unknown> = { nombre, rol: rolNuevo };
  if (listaSlug !== undefined) updates.listaSlug = listaSlug || undefined;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  await Usuario.update({ username }).set(updates as any).go();

  revalidatePath("/admin/usuarios");
}

export async function cambiarListaUsuario(username: string, formData: FormData) {
  const session = await requireAdminAccess();
  if ((session.user as any).rol !== "SUPERADMIN") throw new Error("No autorizado");
  const listaSlug = (formData.get("listaSlug") as string) || undefined;
  if (listaSlug) {
    await Usuario.update({ username }).set({ listaSlug }).go();
  } else {
    await Usuario.update({ username }).remove(["listaSlug"]).go();
  }
  revalidatePath("/admin/usuarios");
}

export async function eliminarUsuario(username: string) {
  const session = await requireAdminAccess();
  const sesionRol = (session.user as any).rol as string;
  const esSuperAdmin = sesionRol === "SUPERADMIN";
  const miListaSlug = (session.user as any).listaSlug as string | null;

  if ((session.user as any).username === username) {
    throw new Error("No podés eliminar tu propia cuenta");
  }

  // ADMIN solo puede eliminar usuarios de su lista
  if (!esSuperAdmin) {
    const { data: target } = await Usuario.get({ username }).go();
    if (!target || target.listaSlug !== miListaSlug) throw new Error("No autorizado");
  }

  await Usuario.delete({ username }).go();
  revalidatePath("/admin/usuarios");
}
