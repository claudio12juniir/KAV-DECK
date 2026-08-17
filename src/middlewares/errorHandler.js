import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError.js";

const PRISMA_ERROR_MAP = {
  P2002: { statusCode: 409, code: "CONFLICT", message: "Já existe um registro com esses dados." },
  P2003: {
    statusCode: 409,
    code: "FOREIGN_KEY_CONSTRAINT",
    message: "Operação bloqueada por vínculo com outro registro.",
  },
  P2025: { statusCode: 404, code: "NOT_FOUND", message: "Registro não encontrado." },
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      return res.status(mapped.statusCode).json({ error: { code: mapped.code, message: mapped.message } });
    }
  }

  console.error(err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Erro interno. Tente novamente." },
  });
}
