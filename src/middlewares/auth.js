import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Projetos Supabase atuais assinam o JWT com chaves assimétricas (ES256) por
// padrão, não mais com um segredo compartilhado — por isso a verificação
// busca a chave pública certa (por `kid`) no endpoint JWKS do próprio
// projeto, em vez de comparar contra um secret estático.
const JWKS = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", process.env.SUPABASE_URL));

export const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticação ausente.");
  }

  const token = header.slice("Bearer ".length);
  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS));
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticação inválido ou expirado.");
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, empresaId: true, role: true, ativo: true, nome: true, email: true, ultimoAcessoEm: true },
  });

  if (!usuario || !usuario.ativo) {
    throw new AppError(403, "FORBIDDEN", "Usuário não encontrado ou inativo.");
  }

  req.user = {
    id: usuario.id,
    empresaId: usuario.empresaId,
    role: usuario.role,
    nome: usuario.nome,
    email: usuario.email,
  };

  // "Histórico de login" real (via login de fato) exigiria a Admin API da
  // Supabase, que este ambiente não tem credencial pra chamar — isso aqui é
  // a aproximação possível sem essa credencial: marca o último acesso à
  // API, jogado fora da linha (fire-and-forget) e throttlado a 1x/5min por
  // usuário pra não gravar a cada requisição.
  const cincoMinutosAtras = new Date(Date.now() - 5 * 60 * 1000);
  if (!usuario.ultimoAcessoEm || usuario.ultimoAcessoEm < cincoMinutosAtras) {
    prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcessoEm: new Date() } }).catch(() => {});
  }

  next();
});
