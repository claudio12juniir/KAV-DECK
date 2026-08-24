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

  // Sem linha nenhuma de Usuario = login do Supabase confirmado mas
  // POST /cadastro/empresa nunca rodou (ex.: confirmação de e-mail
  // interrompeu o fluxo de /criar-conta antes desse passo). Código
  // diferente de "inativo" de propósito: o frontend manda um caso pra
  // retomar o cadastro e o outro pra deslogar com aviso — ver
  // web/src/contexts/AuthContext.jsx.
  const usuario = await loadUsuarioFromPayload(payload);
  if (!usuario) {
    throw new AppError(403, "USUARIO_NAO_CADASTRADO", "Nenhum cadastro de empresa encontrado para este login.");
  }
  if (!usuario.ativo) {
    throw new AppError(403, "USUARIO_INATIVO", "Seu acesso foi desativado. Fale com o administrador da sua empresa.");
  }

  req.user = {
    id: usuario.id,
    empresaId: usuario.empresaId,
    role: usuario.role,
    nome: usuario.nome,
    email: usuario.email,
  };

  // Corta o acesso de TODA a empresa (não só de novos logins) quando a
  // assinatura passou dos 10 dias de carência — ver
  // src/jobs/assinaturasCron.js, que é quem marca SUSPENSA. Checado em toda
  // request autenticada, não só no claim de sessão, porque sessões que já
  // estavam ativas antes da suspensão também precisam parar de funcionar.
  const assinatura = await prisma.assinaturaEmpresa.findUnique({
    where: { empresaId: usuario.empresaId },
    select: { status: true },
  });
  if (assinatura?.status === "SUSPENSA") {
    throw new AppError(402, "ASSINATURA_SUSPENSA", "ACESSO NEGADO! PAGAMENTO EM ATRASO");
  }
  // AGUARDANDO_PAGAMENTO é o status inicial de toda empresa recém-criada
  // (ver src/modules/cadastro/service.js) — sem essa checagem, uma empresa
  // que nunca completou o checkout do Mercado Pago tinha acesso total e
  // gratuito ao sistema para sempre. Diferente de SUSPENSA (código próprio)
  // porque aqui o usuário ainda precisa conseguir chegar até a tela de
  // pagamento — o frontend usa o código pra redirecionar pra lá em vez de
  // simplesmente deslogar.
  if (assinatura?.status === "AGUARDANDO_PAGAMENTO") {
    throw new AppError(
      402,
      "ASSINATURA_PENDENTE",
      "Finalize o pagamento da assinatura para acessar o sistema.",
    );
  }

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

// Usado só pelo fluxo público de auto-cadastro (POST /cadastro/empresa): o
// Supabase Auth user já existe (o frontend acabou de criar via
// supabase.auth.signUp) mas o Usuario/Empresa deste sistema ainda não —
// é exatamente este endpoint que os cria. Por isso verifica só a assinatura
// do JWT, sem exigir (nem checar) um Usuario correspondente.
export const autenticarSupabaseSemUsuario = asyncHandler(async (req, res, next) => {
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

  req.supabaseUser = { id: payload.sub, email: payload.email };
  next();
});
