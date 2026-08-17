import { AppError } from "../utils/AppError.js";

export const validate = (schemas) => (req, res, next) => {
  for (const key of ["params", "query", "body"]) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Dados inválidos.", result.error.flatten());
    }
    req[key] = result.data;
  }
  next();
};
