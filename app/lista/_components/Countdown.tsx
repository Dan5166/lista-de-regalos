"use client";

import { useEffect, useState } from "react";

function calcular(fecha: string) {
  // Comparar contra medianoche de la fecha local del cumpleaños
  const [y, m, d] = fecha.split("-").map(Number);
  const cumple = new Date(y, m - 1, d);
  const hoy = new Date();
  const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const diffMs = cumple.getTime() - hoyMidnight.getTime();
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return { tipo: "hoy" as const };
  if (diffDias < 0) return { tipo: "pasado" as const, dias: Math.abs(diffDias) };

  // Para el countdown en tiempo real, calcular contra ahora
  const diffTotal = cumple.getTime() - hoy.getTime();
  const dias = Math.floor(diffTotal / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffTotal % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diffTotal % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diffTotal % (1000 * 60)) / 1000);

  return { tipo: "futuro" as const, dias, horas, minutos, segundos };
}

function formatFecha(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Countdown({ fecha }: { fecha: string }) {
  const [estado, setEstado] = useState<ReturnType<typeof calcular> | null>(null);

  useEffect(() => {
    setEstado(calcular(fecha));
    const id = setInterval(() => setEstado(calcular(fecha)), 1000);
    return () => clearInterval(id);
  }, [fecha]);

  if (!estado) return null;

  if (estado.tipo === "hoy") {
    return (
      <div className="text-center space-y-1">
        <p className="text-3xl">🎉</p>
        <p className="text-lg font-bold text-violet-700">¡Hoy es el gran día!</p>
        <p className="text-sm text-gray-500">{formatFecha(fecha)}</p>
      </div>
    );
  }

  if (estado.tipo === "pasado") {
    return (
      <div className="text-center space-y-0.5">
        <p className="text-sm text-gray-400">
          {formatFecha(fecha)} · hace {estado.dias} {estado.dias === 1 ? "día" : "días"}
        </p>
      </div>
    );
  }

  const { dias, horas, minutos, segundos } = estado;

  return (
    <div className="text-center space-y-2">
      <p className="text-xs text-gray-400 uppercase tracking-wide">Faltan</p>
      <div className="flex items-end justify-center gap-3">
        {dias > 0 && <Unidad valor={dias} label={dias === 1 ? "día" : "días"} grande />}
        <Unidad valor={horas} label="hs" />
        <Unidad valor={minutos} label="min" />
        <Unidad valor={segundos} label="seg" />
      </div>
      <p className="text-xs text-gray-400">{formatFecha(fecha)}</p>
    </div>
  );
}

function Unidad({ valor, label, grande }: { valor: number; label: string; grande?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`font-bold tabular-nums text-gray-900 leading-none ${grande ? "text-4xl" : "text-2xl"}`}>
        {String(valor).padStart(2, "0")}
      </span>
      <span className="text-xs text-gray-400 mt-0.5">{label}</span>
    </div>
  );
}
