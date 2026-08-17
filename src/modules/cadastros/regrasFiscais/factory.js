import { Router } from "express";
import { auth } from "../../../middlewares/auth.js";
import { requireRole } from "../../../middlewares/rbac.js";
import { validate } from "../../../middlewares/validate.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { AppError } from "../../../utils/AppError.js";
import { idParamSchema, paginationQuerySchema } from "../../../utils/commonSchemas.js";
import { prisma } from "../../../lib/prisma.js";
import { buildPaginatedResult, parsePagination } from "../../../utils/pagination.js";

// As 6 regras fiscais (ICMS/IPI/PIS/COFINS/IBS/CBS) têm CRUD idêntico —
// só muda o modelo do Prisma e o formato de cada uma. Uma fábrica evita
// repetir a mesma rota 6 vezes; cada regra só declara seu schema e select.
export function criarCrudRegraFiscal({ modelo, createSchema, updateSchema, select }) {
  const router = Router();
  router.use(auth);

  router.get(
    "/",
    validate({ query: paginationQuerySchema }),
    asyncHandler(async (req, res) => {
      const { skip, take, page, pageSize } = parsePagination(req.query);
      const where = { empresaId: req.user.empresaId };
      const [items, total] = await Promise.all([
        prisma[modelo].findMany({ where, select, skip, take, orderBy: { descricao: "asc" } }),
        prisma[modelo].count({ where }),
      ]);
      res.json(buildPaginatedResult({ items, total, page, pageSize }));
    }),
  );

  router.get(
    "/:id",
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const item = await prisma[modelo].findFirst({
        where: { id: req.params.id, empresaId: req.user.empresaId },
        select,
      });
      if (!item) throw new AppError(404, "NOT_FOUND", "Regra fiscal não encontrada.");
      res.json(item);
    }),
  );

  router.post(
    "/",
    requireRole("ADMIN", "GESTOR", "FISCAL"),
    validate({ body: createSchema }),
    asyncHandler(async (req, res) => {
      const item = await prisma[modelo].create({
        data: { ...req.body, empresaId: req.user.empresaId },
        select,
      });
      res.status(201).json(item);
    }),
  );

  router.patch(
    "/:id",
    requireRole("ADMIN", "GESTOR", "FISCAL"),
    validate({ params: idParamSchema, body: updateSchema }),
    asyncHandler(async (req, res) => {
      const existente = await prisma[modelo].findFirst({
        where: { id: req.params.id, empresaId: req.user.empresaId },
        select: { id: true },
      });
      if (!existente) throw new AppError(404, "NOT_FOUND", "Regra fiscal não encontrada.");
      const item = await prisma[modelo].update({ where: { id: req.params.id }, data: req.body, select });
      res.json(item);
    }),
  );

  router.delete(
    "/:id",
    requireRole("ADMIN", "GESTOR", "FISCAL"),
    validate({ params: idParamSchema }),
    asyncHandler(async (req, res) => {
      const existente = await prisma[modelo].findFirst({
        where: { id: req.params.id, empresaId: req.user.empresaId },
        select: { id: true },
      });
      if (!existente) throw new AppError(404, "NOT_FOUND", "Regra fiscal não encontrada.");
      await prisma[modelo].delete({ where: { id: req.params.id } });
      res.status(204).send();
    }),
  );

  return router;
}
