"use server";

import { Lista, Regalo, Usuario } from "@/lib/entities";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).rol !== "SUPERADMIN") {
    throw new Error("No autorizado");
  }
  return session;
}

export async function crearLista(formData: FormData) {
  await requireAdmin();

  const slug = formData.get("slug") as string;
  const titulo = formData.get("titulo") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;
  const fecha = (formData.get("fecha") as string) || undefined;

  await Lista.create({ slug, titulo, descripcion, fecha }).go();

  revalidatePath("/admin/listas");
}

export async function editarLista(slug: string, formData: FormData) {
  await requireAdmin();

  const titulo = formData.get("titulo") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;
  const fecha = (formData.get("fecha") as string) || undefined;

  await Lista.update({ slug }).set({ titulo, descripcion, fecha }).go();

  revalidatePath("/admin/listas");
}

export async function asignarUsuarioALista(listaSlug: string, username: string) {
  await requireAdmin();
  if (!username) throw new Error("Seleccioná un usuario");
  await Usuario.update({ username }).set({ listaSlug }).go();
  revalidatePath("/admin/listas", "layout");
}

export async function desasignarUsuario(username: string) {
  await requireAdmin();
  await Usuario.update({ username }).remove(["listaSlug"]).go();
  revalidatePath("/admin/listas", "layout");
}

export async function eliminarLista(slug: string) {
  await requireAdmin();

  const { data: regalos } = await Regalo.query.primary({ listaSlug: slug }).go();
  await Promise.all(
    regalos.map((r) => Regalo.delete({ listaSlug: slug, regaloId: r.regaloId }).go())
  );

  await Lista.delete({ slug }).go();
  revalidatePath("/admin/listas");
}
