"use server";

import { Usuario } from "@/lib/entities";
import { auth, signOut } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function cerrarSesion() {
  await signOut({ redirectTo: "/login" });
}

export async function cambiarContrasena(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const username = (session.user as any).username as string;
  const { data: usuario } = await Usuario.get({ username }).go();
  if (!usuario) return { error: "Usuario no encontrado" };

  const ok = await bcrypt.compare(currentPassword, usuario.passwordHash);
  if (!ok) return { error: "La contraseña actual es incorrecta" };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await Usuario.update({ username }).set({ passwordHash }).go();

  return {};
}
