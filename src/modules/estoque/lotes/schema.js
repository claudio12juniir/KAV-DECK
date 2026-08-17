import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/commonSchemas.js";

export const listLotesQuerySchema = paginationQuerySchema.extend({
  produtoId: z.string().uuid().optional(),
  dataValidadeAte: z.coerce.date().optional(),
});
