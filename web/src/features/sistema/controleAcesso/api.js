import { apiClient } from "../../../lib/apiClient.js";

export const controleAcessoApi = {
  listarUsuarios: () => apiClient.get("/sistema/controle-acesso/usuarios"),
  obterPermissoes: (usuarioId) => apiClient.get(`/sistema/controle-acesso/${usuarioId}`),
  definirPermissao: (usuarioId, { modulo, acao, permitida }) =>
    apiClient.patch(`/sistema/controle-acesso/${usuarioId}`, { modulo, acao, permitida }),
  removerOverride: (usuarioId, modulo, acao) =>
    apiClient.delete(`/sistema/controle-acesso/${usuarioId}/${modulo}/${acao}`),
};
