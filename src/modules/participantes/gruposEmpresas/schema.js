import { z } from "zod";

export const createGrupoEmpresasSchema = z.object({
  nome: z.string().min(1).max(120),
});

export const updateGrupoEmpresasSchema = createGrupoEmpresasSchema.partial();
