# claude.md — Mapeamento Completo do Sistema ERP (Base para Reconstrução)

> Documento gerado a partir de engenharia reversa (somente leitura/navegação, sem
> edições, criações ou exclusões) de um ERP de distribuição/atacado de hortifrúti
> (modelo CEASA), para servir de base à reconstrução em Node.js + Express +
> React/React Native, com filosofia de design minimalista e eficiente. Dados sensíveis
> reais (nomes, CNPJs, contas bancárias, certificados) foram omitidos e substituídos
> por descrições estruturais/genéricas.

## 1. Visão Geral

Sistema de gestão (ERP) voltado para empresas de distribuição de produtos
hortifrutigranjeiros, cobrindo o ciclo completo: cadastros básicos, compras (inclusive
de produtores rurais), vendas, controle de estoque (com lotes, caixas em comodato e
rastreabilidade), financeiro (contas a pagar/receber, caixa, cheques, contas bancárias)
e fiscal (emissão e consulta de NF-e, manifestação do destinatário, CFOP, tributos).
Coexistem dois front-ends sob o mesmo domínio/sessão: uma aplicação legada
(hash-router, telas tabulares densas) e uma aplicação mais nova (shell com abas
superiores, visual mais atual).

Módulos mapeados integralmente: Cadastros, Participantes, Compras, Vendas, Financeiro,
Estoque, Fiscal, Ferramentas Gerenciais/Sistema.

## 2. Entidades de Dados

**2.1 Produto** — código, descrição, unidade de medida, categoria, departamento,
classificação fiscal (NCM, CST/CFOP padrão), estoque mínimo/máximo, indicador de
perecível/controle por lote, preço de referência, status ativo/inativo.

**2.2 Categoria de Produto** — código, nome; agrupamento usado em relatórios (curva ABC).

**2.3 Departamento** — código, nome; nível hierárquico acima da categoria.

**2.4 Unidade de Medida** — sigla, descrição, fator de conversão entre unidades.

**2.5 ICMS** — cadastro de regra tributária com CST origem/tributação, alíquota, base
de cálculo, modalidade; listagem + modal de criação.

**2.6 IPI / PIS / COFINS** — cadastro de CSTs e alíquotas por tributo, associável a
produto/operação.

**2.7 IBS e CBS** — estrutura preparatória para a reforma tributária (CST, alíquota,
vigência).

**2.8 Participante** (modelo compartilhado por Cliente e Fornecedor) — Identificação
(razão social, fantasia, CPF/CNPJ, IE, tipo de pessoa); Endereço; Faturamento (condição
de pagamento padrão, tabela de preço, limite de crédito); Despesas repassáveis; Emissão
de Cheques; Produtor Rural (DAP, talão); Cobrança/Entrega (endereços alternativos).

**2.9 Cliente** — extensão do Participante para venda; possui bloqueio financeiro
(liberado/bloqueado), vendedor/representante padrão, rota de entrega.

**2.10 Fornecedor** — extensão do Participante para compra; pode ser produtor rural ou
empresa regular.

**2.11 Grupo de Empresas** — agrupamento de participantes para consolidar limite de
crédito e relatórios.

**2.12 Comprador / Representante / Separador / Vendedor** — colaboradores vinculados a
operações específicas (compra, venda externa/comissionada, picking de estoque,
atendimento).

**2.13 Transportadora** — empresas vinculadas a pedidos e ao controle de frete/descarga.

**2.14 Pedido de Compra** — cabeçalho (fornecedor, data, condição de pagamento) + itens
(produto, quantidade, preço, lote); gera título a pagar e movimento de estoque.

**2.15 Pedido de Venda** — cabeçalho (cliente, vendedor, tabela de preço, condição de
pagamento) + itens (produto, quantidade, preço, desconto); consulta com filtro de status.

**2.16 Título Financeiro (Pagar/Receber)** — número, participante, valor, vencimento,
forma de pagamento, status (aberto, baixado, vencido, cancelado), boleto/nosso número;
baixa em lote disponível.

**2.17 Tesouraria** — Caixa (movimentos diários), Fluxo de Caixa (projeção),
Contas e Bancos, Plano de Contas (hierárquico), Centro de Custos (rateio).

**2.18 Cheques Emitidos / de Terceiros** — controle de cheques próprios e recebidos,
com status (em carteira, compensado, devolvido).

**2.19 Estoque** — Controle (kardex por produto), Controle por Lote, Prévia (saldo
futuro projetado), Estoque Faturado (faturado vs. físico, min/máx), Inventário Físico
(ajuste manual), Estoque de Caixas (comodato de embalagens), Terminal de Recebimento
(SIF, temperatura, validade, veículo), Rastreabilidade (lote → cliente final).

**2.20 Nota Fiscal Eletrônica** — cabeçalho (série, número, chave, natureza da
operação, CFOP), itens tributados (ICMS/IPI/PIS/COFINS), status (Em Digitação,
Autorizado, Cancelado, Uso Denegado, Rejeição, Arquivo Criado, Em Processamento);
submodalidades: Entrada, Saída, Produtor Rural, Terceiros, Inutilização.

**2.21 CFOP / Natureza da Operação** — cadastros de apoio para classificar cada
operação fiscal.

**2.22 Certificado Digital** — cadastro do certificado A1 usado na assinatura das NF-e,
com data de vencimento (sem exposição de conteúdo/senha).

## 3. Fluxos de Negócio

**3.1 Compra** — cadastro/consulta de fornecedor → Terminal de Compras (pedido) →
recebimento físico (SIF, temperatura) → baixa em estoque por lote → título a pagar →
NF-e de entrada → manifestação do destinatário (Ciência/Confirmação/
Desconhecimento/Não Realizada).

**3.2 Venda** — consulta de cliente (verifica bloqueio financeiro) → Terminal de Vendas
(pedido) → separação via Terminal de Separadores (picking) → faturamento/NF-e de saída
→ baixa de estoque → título a receber → rota de entrega (Itinerário) → eventual
Devolução de Venda.

**3.3 Financeiro (recebimento)** — Títulos a Receber gerados por venda → Baixa de
Títulos (individual ou em lote) → conciliação em Caixa/Contas e Bancos → Fluxo de Caixa
atualizado; cheques de terceiros seguem controle próprio até compensação.

**3.4 Estoque/Rastreabilidade** — entrada via Recebimento gera lote → movimentações
(venda, transferência, perda) referenciam o lote → módulo de Rastreabilidade permite
localizar todos os destinos de um lote específico.

**3.5 Fiscal (NF-e)** — emissão (Entrada/Saída/Produtor Rural/Terceiros) → assinatura
via Certificado Digital → transmissão à SEFAZ → acompanhamento de status em Consulta de
Notas Fiscais e Terminal de NF → Utilitários para relatórios agregados (por CFOP, por
produto) e download de XML em lote.

## 4. Regras de Negócio Identificadas

- Cliente com bloqueio financeiro ativo não pode gerar novo pedido de venda até
  liberação em "Bloqueio de Clientes".
- Estoque é sempre controlado por lote quando o produto é perecível, permitindo
  rastreabilidade ponta a ponta.
- Fornecedor pode assumir o papel de "Produtor Rural", alterando o fluxo fiscal
  (nota avulsa/fatura de produtor em vez de NF-e tradicional do fornecedor).
- Caixas/embalagens (paletes, caixas plásticas) têm controle de comodato separado do
  estoque de mercadoria, pois pertencem fisicamente à empresa mas circulam com clientes
  e fornecedores.
- Toda NF-e de entrada de terceiros passa por manifestação do destinatário antes de
  ser considerada regularizada no sistema.
- Tabela de Preços e Preços de Compra/Venda são entidades independentes dos
  cadastros de produto, permitindo múltiplas listas de preço vigentes simultaneamente.

## 5. Perfis de Usuário (Personas)

- **Comprador** — opera Terminal de Compras, Consulta de Preços, Controle de Frete.
- **Vendedor/Representante** — opera Terminal de Vendas, Tabela de Preços, Consulta de
  Pedidos.
- **Separador** — opera Terminal de Separadores (picking físico do estoque).
- **Financeiro** — opera Títulos a Pagar/Receber, Baixa de Títulos, Caixa, Cheques,
  Bloqueio de Clientes.
- **Fiscal/Contábil** — opera Terminal de NF, Consulta de Notas Fiscais, Certificados,
  CFOP, Plano de Contas.
- **Estoque/Recebimento** — opera Terminal de Recebimento, Inventário Físico,
  Rastreabilidade.
- **Gestor/Administrador** — acesso a Relatórios Gerenciais, Analytics, Dashboards e
  Controle de Acesso (usuários).

## 6. Módulos Complementares (Fiscal e Gerenciais)

**6.1 Consulta de Itens da Nota Fiscal** — filtros por data, empresa, produto,
indicador do emitente, tipo de operação, status, nota de produtor e CSTs; grid com
status, quantidade, produto, valor, CFOP, empresa, número, datas, tributos por item.

**6.2 Nota Fiscal de Compras / Manifestação do Destinatário** — implementa o fluxo
oficial da SEFAZ (Ciência, Confirmação, Operação Não Realizada, Desconhecimento) sobre
as notas recebidas de fornecedores, com filtros por número, data, indicador do
emitente, se importada e tipo de evento; permite download de XML.

**6.3 Utilitários da Nota Fiscal** — central de relatórios fiscais: por CFOP, por CFOP
com totais por UF, por produto, e download de XML em lote, com exportação em
Imprimir/PDF/XLS.

**6.4 Analytics** — painel com duas abas: Compras (Compra e Vendas por Produto, Curva
ABC de Fornecedores, Dashboard de Compra por Lote) e Vendas (Curva ABC de Produtos,
Curva ABC de Clientes).

**6.5 Dashboards Gerenciais** — dois dashboards: "Faturamento" (visão de vendas/custos)
e "Total de Títulos a Pagar e Receber" (comparativo anual filtrável por ano).

## 7. Recomendações de Arquitetura (Node.js/Express/React)

- **Backend**: API REST (ou GraphQL) em Node.js/Express, com camada de domínio
  separada por bounded contexts (Cadastros, Compras, Vendas, Financeiro, Estoque,
  Fiscal), banco relacional (Postgres) dado o forte relacionamento entre entidades.
- **Autenticação/Autorização**: perfis de usuário mapeados na seção 5 como base para
  RBAC (Role-Based Access Control) desde o primeiro release.
- **Fiscal**: isolar a integração com SEFAZ (emissão, manifestação, certificado) em um
  microsserviço/módulo próprio, dado o alto acoplamento a regras externas e
  necessidade de auditoria.
- **Estoque**: modelar lote como entidade de primeira classe (não apenas atributo),
  para suportar rastreabilidade nativa via grafo de movimentações.
- **Frontend**: React (web) reaproveitando componentes entre os fluxos de
  Compras/Vendas (estrutura de pedido é muito similar); React Native apenas para
  fluxos móveis prioritários (Separador/picking, Recebimento com leitura de
  código/temperatura).
- **UX**: consolidar os dois front-ends legados em uma única navegação (hoje dividida
  entre "v1" hash-router e "v2" com abas), priorizando busca global e menos cliques
  para os fluxos mais usados (Terminal de Vendas, Terminal de Compras, Consulta de
  Títulos).