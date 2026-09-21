import { auditarAtualizacao } from "../../../lib/auditLog.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import * as service from "./service.js";

const ENTIDADE = "configuracao-fiscal";

// cscToken é o Código de Segurança do Contribuinte (credencial usada no hash
// do QR Code da NFC-e) — nunca deve aparecer em texto plano no histórico de
// alterações, então sai do antes/depois antes de auditar (se ele mudou, as
// outras diferenças do registro já mostram que a configuração foi alterada).
function semSegredo(configuracao) {
  const { cscToken, ...resto } = configuracao;
  return resto;
}

export const obter = asyncHandler(async (req, res) => {
  const configuracao = await service.obter({ empresaId: req.user.empresaId });
  res.json(configuracao);
});

export const salvar = asyncHandler(async (req, res) => {
  const antes = await service.obter({ empresaId: req.user.empresaId });
  const configuracao = await service.salvar({ empresaId: req.user.empresaId, ...req.body });
  await auditarAtualizacao({
    empresaId: req.user.empresaId,
    entidade: ENTIDADE,
    entidadeId: configuracao.id ?? req.user.empresaId,
    usuarioId: req.user.id,
    antes: semSegredo(antes),
    depois: semSegredo(configuracao),
  });
  res.json(configuracao);
});
