import { loadUsuarioFromPayload, verifyAccessToken } from "../lib/authToken.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function autenticar(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticação ausente.");
  }

  const token = header.slice("Bearer ".length);
  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Token de autenticação inválido ou expirado.");
  }

  const usuario = await loadUsuarioFromPayload(payload);
  if (!usuario) {
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
}

// Sessão única por dispositivo (ver prisma/schema.prisma:SessaoAtiva): o
// cliente manda um X-Session-Id próprio (não é o JWT) em todo request: se o
// banco tiver um sessaoId diferente pra esse usuário — porque ele logou em
// outro dispositivo depois — essa sessão está "velha" e cai. Fail-open
// quando o header não vem, pra não quebrar clientes antigos/health checks.
async function checarSessaoUnica(req) {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) return;

  const sessaoAtiva = await prisma.sessaoAtiva.findUnique({
    where: { usuarioId: req.user.id },
    select: { sessaoId: true },
  });

  if (sessaoAtiva && sessaoAtiva.sessaoId !== sessionId) {
    throw new AppError(
      401,
      "SESSION_REVOKED",
      "Sua sessão foi encerrada porque esta conta foi acessada em outro dispositivo.",
    );
  }
}

export const auth = asyncHandler(async (req, res, next) => {
  await autenticar(req);
  await checarSessaoUnica(req);
  next();
});

// Variante sem a checagem de sessão única — usada só pelo endpoint que
// reivindica a sessão (POST /me/sessao). Ali a checagem acima rejeitaria a
// própria reivindicação, porque o banco ainda guarda o sessaoId antigo até
// o claim terminar de rodar.
export const authSemChecagemDeSessao = asyncHandler(async (req, res, next) => {
  await autenticar(req);
  next();
});
