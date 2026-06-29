"use client";

import { useState } from "react";
import { cambiarContrasena } from "../actions";

export function CambiarContrasenaForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const form = e.currentTarget;
    const current = (form.elements.namedItem("current") as HTMLInputElement).value;
    const next = (form.elements.namedItem("next") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;

    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden");
      setLoading(false);
      return;
    }

    if (next.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    const result = await cambiarContrasena(current, next);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    form.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Contraseña actual <span className="text-red-400">*</span>
        </label>
        <input
          name="current"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nueva contraseña <span className="text-red-400">*</span>
        </label>
        <input
          name="next"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Confirmar nueva contraseña <span className="text-red-400">*</span>
        </label>
        <input
          name="confirm"
          type="password"
          required
          placeholder="••••••••"
          autoComplete="new-password"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <p className="text-emerald-700 text-sm">Contraseña actualizada correctamente.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors cursor-pointer mt-2"
      >
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
