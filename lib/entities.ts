import { Entity, Service } from "electrodb";
import { ddb, TABLE_NAME } from "./dynamo";

export const Usuario = new Entity(
  {
    model: { entity: "usuario", version: "1", service: "listaregalos" },
    attributes: {
      username: { type: "string", required: true },
      passwordHash: { type: "string", required: true },
      nombre: { type: "string", required: true },
      rol: { type: ["SUPERADMIN", "ADMIN", "CUMPLEANERO", "INVITADO"] as const, required: true, default: "INVITADO" },
      listaSlug: { type: "string" },
      createdAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        pk: { field: "pk", composite: ["username"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
  { table: TABLE_NAME, client: ddb }
);

export const Lista = new Entity(
  {
    model: { entity: "lista", version: "1", service: "listaregalos" },
    attributes: {
      slug: { type: "string", required: true },
      titulo: { type: "string", required: true },
      descripcion: { type: "string" },
      fecha: { type: "string" },
      edicionBloqueada: { type: "boolean", default: false },
      createdAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        pk: { field: "pk", composite: ["slug"] },
        sk: { field: "sk", composite: [] },
      },
    },
  },
  { table: TABLE_NAME, client: ddb }
);

export const Regalo = new Entity(
  {
    model: { entity: "regalo", version: "1", service: "listaregalos" },
    attributes: {
      listaSlug: { type: "string", required: true },
      regaloId: { type: "string", required: true },
      nombre: { type: "string", required: true },
      descripcion: { type: "string" },
      link: { type: "string" },
      imagenUrl: { type: "string" },
      prioridad: { type: "number", default: 0 },
      // Reserva embebida (1 a 1 con el regalo)
      compradoPorId: { type: "string" },
      compradoPorNombre: { type: "string" },
      compradoAt: { type: "string" },
      createdAt: { type: "string", default: () => new Date().toISOString() },
    },
    indexes: {
      primary: {
        // pk = lista a la que pertenece -> permite pedir "todos los regalos de la lista" en un query
        pk: { field: "pk", composite: ["listaSlug"] },
        sk: { field: "sk", composite: ["regaloId"] },
      },
    },
  },
  { table: TABLE_NAME, client: ddb }
);

export const listaRegalosService = new Service(
  { Usuario, Lista, Regalo },
  { table: TABLE_NAME, client: ddb }
);
