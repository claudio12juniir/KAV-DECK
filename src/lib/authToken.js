import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "./prisma.js";

// Projetos Supabase atuais assinam o JWT com chaves assimétricas (ES256) por
// padrão, não mais com um segredo compartilhado — por isso a verificação
// busca a chave pública certa (por `kid`) no endpoint JWKS do próprio
// projeto, em vez de comparar contra um secret estático.
// Compartilhado entre o middleware HTTP (auth.js) e o handshake do
// Socket.io (realtime/index.js), que precisam validar exatamente o mesmo
// token de sessão do Supabase.
const JWKS = createRemoteJWKSet(new URL("/auth/v1/.well-known/jwks.json", process.env.SUPABASE_URL));

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, JWKS);
  return payload;
}

// Devolve o Usuario cru (mesmo se `ativo: false`) ou `null` só quando não
// existe linha nenhuma — quem chama precisa diferenciar "nunca terminou o
// cadastro" (sem linha, ver /cadastro/empresa) de "conta desativada pelo
// admin" (linha existe, ativo: false), porque o tratamento no frontend é
// diferente pros dois casos (ver src/middlewares/auth.js).
export async function loadUsuarioFromPayload(payload) {
  return prisma.usuario.findUnique({
    where: { id: payload.sub },
    select: { id: true, empresaId: true, role: true, ativo: true, nome: true, email: true, ultimoAcessoEm: true },
  });
}
