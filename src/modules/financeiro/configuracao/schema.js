import { z } from "zod";

export const atualizarConfiguracaoFinanceiraSchema = z.object({
  contaBancariaPadraoBoletoId: z.string().uuid().nullable(),
});
