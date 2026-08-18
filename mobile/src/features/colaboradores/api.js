import { apiClient } from "../../lib/apiClient.js";

export async function listSeparadores() {
  const { items } = await apiClient.get("/participantes/colaboradores", {
    tipo: "SEPARADOR",
    pageSize: 100,
  });
  return items;
}
