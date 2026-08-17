-- CreateEnum
CREATE TYPE "RoleUsuario" AS ENUM ('ADMIN', 'COMPRADOR', 'VENDEDOR', 'SEPARADOR', 'FINANCEIRO', 'FISCAL', 'ESTOQUE', 'GESTOR');

-- CreateEnum
CREATE TYPE "TipoColaborador" AS ENUM ('COMPRADOR', 'VENDEDOR', 'REPRESENTANTE', 'SEPARADOR');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TipoEndereco" AS ENUM ('PRINCIPAL', 'COBRANCA', 'ENTREGA');

-- CreateEnum
CREATE TYPE "StatusBloqueioCliente" AS ENUM ('LIBERADO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusPedidoCompra" AS ENUM ('ABERTO', 'APROVADO', 'RECEBIDO_PARCIAL', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPedidoVenda" AS ENUM ('ABERTO', 'SEPARACAO', 'FATURADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'PERDA', 'AJUSTE_INVENTARIO');

-- CreateEnum
CREATE TYPE "TipoMovimentoComodato" AS ENUM ('ENTREGA', 'DEVOLUCAO');

-- CreateEnum
CREATE TYPE "TipoTitulo" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "StatusTitulo" AS ENUM ('ABERTO', 'BAIXADO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusCheque" AS ENUM ('EM_CARTEIRA', 'COMPENSADO', 'DEVOLVIDO');

-- CreateEnum
CREATE TYPE "TipoOperacaoNF" AS ENUM ('ENTRADA', 'SAIDA', 'PRODUTOR_RURAL', 'TERCEIROS', 'INUTILIZACAO');

-- CreateEnum
CREATE TYPE "StatusNotaFiscal" AS ENUM ('EM_DIGITACAO', 'AUTORIZADO', 'CANCELADO', 'USO_DENEGADO', 'REJEICAO', 'ARQUIVO_CRIADO', 'EM_PROCESSAMENTO');

-- CreateEnum
CREATE TYPE "TipoEventoManifestacao" AS ENUM ('CIENCIA', 'CONFIRMACAO', 'DESCONHECIMENTO', 'NAO_REALIZADA');

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RoleUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoColaborador" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "departamento_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fator_conversao" DECIMAL(14,6) NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade_medida_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "ncm" TEXT,
    "cst_cfop_padrao" TEXT,
    "estoque_minimo" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "estoque_maximo" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "perecivel" BOOLEAN NOT NULL DEFAULT false,
    "controla_lote" BOOLEAN NOT NULL DEFAULT false,
    "preco_referencia" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_icms" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst_origem" TEXT NOT NULL,
    "cst_tributacao" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "base_calculo" DECIMAL(14,4) NOT NULL,
    "modalidade" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_icms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_ipi" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_ipi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_pis" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_pis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_cofins" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_cofins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_ibs" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_ibs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_cbs" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cst" TEXT NOT NULL,
    "aliquota" DECIMAL(6,4) NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_cbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabelas_preco" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabelas_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_tabela_preco" (
    "id" UUID NOT NULL,
    "tabela_preco_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "preco" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "itens_tabela_preco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "condicoes_pagamento" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "numero_parcelas" INTEGER NOT NULL,
    "intervalo_dias" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "condicoes_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cpf_cnpj" TEXT NOT NULL,
    "ie" TEXT,
    "condicao_pagamento_id" UUID,
    "limite_credito" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "despesas_repassaveis" BOOLEAN NOT NULL DEFAULT false,
    "permite_emissao_cheque" BOOLEAN NOT NULL DEFAULT false,
    "is_produtor_rural" BOOLEAN NOT NULL DEFAULT false,
    "dap_produtor_rural" TEXT,
    "talao_produtor_rural" TEXT,
    "grupo_empresas_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "tipo" "TipoEndereco" NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "cep" TEXT NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "participante_id" UUID NOT NULL,
    "bloqueio_financeiro" "StatusBloqueioCliente" NOT NULL DEFAULT 'LIBERADO',
    "vendedor_padrao_id" UUID,
    "rota_entrega_id" UUID,
    "tabela_preco_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("participante_id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "participante_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("participante_id")
);

-- CreateTable
CREATE TABLE "grupos_empresas" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transportadoras" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "razao_social" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportadoras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_entrega" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "transportadora_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotas_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_compra" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "fornecedor_id" UUID NOT NULL,
    "comprador_id" UUID,
    "condicao_pagamento_id" UUID,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPedidoCompra" NOT NULL DEFAULT 'ABERTO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_compra" (
    "id" UUID NOT NULL,
    "pedido_compra_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "lote_id" UUID,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "preco_unitario" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "itens_pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_venda" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "vendedor_id" UUID,
    "tabela_preco_id" UUID,
    "condicao_pagamento_id" UUID,
    "rota_entrega_id" UUID,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPedidoVenda" NOT NULL DEFAULT 'ABERTO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_venda" (
    "id" UUID NOT NULL,
    "pedido_venda_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "preco_unitario" DECIMAL(14,4) NOT NULL,
    "desconto" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_pedido_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucoes_venda" (
    "id" UUID NOT NULL,
    "pedido_venda_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolucoes_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_devolucao_venda" (
    "id" UUID NOT NULL,
    "devolucao_venda_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "itens_devolucao_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "fornecedor_id" UUID,
    "data_recebimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_validade" DATE,
    "sif" TEXT,
    "temperatura_recebimento" DECIMAL(5,2),
    "veiculo" TEXT,
    "quantidade_inicial" DECIMAL(14,4) NOT NULL,
    "quantidade_atual" DECIMAL(14,4) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "lote_id" UUID,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "pedido_compra_id" UUID,
    "pedido_venda_id" UUID,
    "inventario_fisico_id" UUID,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios_fisicos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventarios_fisicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_inventario" (
    "id" UUID NOT NULL,
    "inventario_fisico_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "lote_id" UUID,
    "quantidade_contada" DECIMAL(14,4) NOT NULL,
    "quantidade_sistema" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "itens_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_caixa_embalagem" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "capacidade" DECIMAL(14,4),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_caixa_embalagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_comodato" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "tipo_caixa_embalagem_id" UUID NOT NULL,
    "tipo" "TipoMovimentoComodato" NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_comodato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titulos_financeiros" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo" "TipoTitulo" NOT NULL,
    "participante_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "vencimento" DATE NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "status" "StatusTitulo" NOT NULL DEFAULT 'ABERTO',
    "boleto" TEXT,
    "nosso_numero" TEXT,
    "pedido_compra_id" UUID,
    "pedido_venda_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titulos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baixas_titulo" (
    "id" UUID NOT NULL,
    "titulo_financeiro_id" UUID NOT NULL,
    "data_baixa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_baixado" DECIMAL(14,4) NOT NULL,
    "forma_baixa" TEXT NOT NULL,

    CONSTRAINT "baixas_titulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_caixa" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "conta_bancaria_id" UUID,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "movimentos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_contas" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "conta_pai_id" UUID,

    CONSTRAINT "plano_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_custo" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_emitidos" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "conta_bancaria_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_compensacao" DATE,
    "status" "StatusCheque" NOT NULL DEFAULT 'EM_CARTEIRA',

    CONSTRAINT "cheques_emitidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_terceiros" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "participante_id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "data_recebimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_compensacao" DATE,
    "status" "StatusCheque" NOT NULL DEFAULT 'EM_CARTEIRA',

    CONSTRAINT "cheques_terceiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "chave_acesso" TEXT,
    "natureza_operacao_id" UUID NOT NULL,
    "tipo_operacao" "TipoOperacaoNF" NOT NULL,
    "status" "StatusNotaFiscal" NOT NULL DEFAULT 'EM_DIGITACAO',
    "participante_id" UUID NOT NULL,
    "certificado_digital_id" UUID,
    "pedido_compra_id" UUID,
    "pedido_venda_id" UUID,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_nota_fiscal" (
    "id" UUID NOT NULL,
    "nota_fiscal_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "cfop_id" UUID NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "valor_unitario" DECIMAL(14,4) NOT NULL,
    "valor_icms" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "valor_ipi" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "valor_pis" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "valor_cofins" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_nota_fiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifestacoes_destinatario" (
    "id" UUID NOT NULL,
    "nota_fiscal_id" UUID NOT NULL,
    "tipo_evento" "TipoEventoManifestacao" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifestacoes_destinatario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfops" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "cfops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "naturezas_operacao" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "cfop_padrao_id" UUID NOT NULL,

    CONSTRAINT "naturezas_operacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados_digitais" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "data_vencimento" DATE NOT NULL,

    CONSTRAINT "certificados_digitais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_empresa_id_idx" ON "usuarios"("empresa_id");

-- CreateIndex
CREATE INDEX "colaboradores_empresa_id_tipo_idx" ON "colaboradores"("empresa_id", "tipo");

-- CreateIndex
CREATE INDEX "departamentos_empresa_id_idx" ON "departamentos"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_empresa_id_codigo_key" ON "departamentos"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "categorias_empresa_id_idx" ON "categorias"("empresa_id");

-- CreateIndex
CREATE INDEX "categorias_departamento_id_idx" ON "categorias"("departamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_empresa_id_codigo_key" ON "categorias"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "unidades_medida_empresa_id_idx" ON "unidades_medida"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_medida_empresa_id_sigla_key" ON "unidades_medida"("empresa_id", "sigla");

-- CreateIndex
CREATE INDEX "produtos_empresa_id_ativo_idx" ON "produtos"("empresa_id", "ativo");

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_empresa_id_codigo_key" ON "produtos"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "regras_icms_empresa_id_idx" ON "regras_icms"("empresa_id");

-- CreateIndex
CREATE INDEX "regras_ipi_empresa_id_idx" ON "regras_ipi"("empresa_id");

-- CreateIndex
CREATE INDEX "regras_pis_empresa_id_idx" ON "regras_pis"("empresa_id");

-- CreateIndex
CREATE INDEX "regras_cofins_empresa_id_idx" ON "regras_cofins"("empresa_id");

-- CreateIndex
CREATE INDEX "regras_ibs_empresa_id_idx" ON "regras_ibs"("empresa_id");

-- CreateIndex
CREATE INDEX "regras_cbs_empresa_id_idx" ON "regras_cbs"("empresa_id");

-- CreateIndex
CREATE INDEX "tabelas_preco_empresa_id_ativa_idx" ON "tabelas_preco"("empresa_id", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "itens_tabela_preco_tabela_preco_id_produto_id_key" ON "itens_tabela_preco"("tabela_preco_id", "produto_id");

-- CreateIndex
CREATE INDEX "condicoes_pagamento_empresa_id_idx" ON "condicoes_pagamento"("empresa_id");

-- CreateIndex
CREATE INDEX "participantes_empresa_id_ativo_idx" ON "participantes"("empresa_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_empresa_id_cpf_cnpj_key" ON "participantes"("empresa_id", "cpf_cnpj");

-- CreateIndex
CREATE INDEX "enderecos_participante_id_idx" ON "enderecos"("participante_id");

-- CreateIndex
CREATE INDEX "clientes_bloqueio_financeiro_idx" ON "clientes"("bloqueio_financeiro");

-- CreateIndex
CREATE INDEX "grupos_empresas_empresa_id_idx" ON "grupos_empresas"("empresa_id");

-- CreateIndex
CREATE INDEX "transportadoras_empresa_id_idx" ON "transportadoras"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "transportadoras_empresa_id_cnpj_key" ON "transportadoras"("empresa_id", "cnpj");

-- CreateIndex
CREATE INDEX "rotas_entrega_empresa_id_idx" ON "rotas_entrega"("empresa_id");

-- CreateIndex
CREATE INDEX "pedidos_compra_empresa_id_status_idx" ON "pedidos_compra"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "pedidos_compra_fornecedor_id_idx" ON "pedidos_compra"("fornecedor_id");

-- CreateIndex
CREATE INDEX "itens_pedido_compra_pedido_compra_id_idx" ON "itens_pedido_compra"("pedido_compra_id");

-- CreateIndex
CREATE INDEX "itens_pedido_compra_produto_id_idx" ON "itens_pedido_compra"("produto_id");

-- CreateIndex
CREATE INDEX "pedidos_venda_empresa_id_status_idx" ON "pedidos_venda"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "pedidos_venda_cliente_id_idx" ON "pedidos_venda"("cliente_id");

-- CreateIndex
CREATE INDEX "itens_pedido_venda_pedido_venda_id_idx" ON "itens_pedido_venda"("pedido_venda_id");

-- CreateIndex
CREATE INDEX "itens_pedido_venda_produto_id_idx" ON "itens_pedido_venda"("produto_id");

-- CreateIndex
CREATE INDEX "devolucoes_venda_pedido_venda_id_idx" ON "devolucoes_venda"("pedido_venda_id");

-- CreateIndex
CREATE INDEX "itens_devolucao_venda_devolucao_venda_id_idx" ON "itens_devolucao_venda"("devolucao_venda_id");

-- CreateIndex
CREATE INDEX "lotes_empresa_id_data_validade_idx" ON "lotes"("empresa_id", "data_validade");

-- CreateIndex
CREATE INDEX "lotes_produto_id_idx" ON "lotes"("produto_id");

-- CreateIndex
CREATE INDEX "movimentos_estoque_empresa_id_produto_id_idx" ON "movimentos_estoque"("empresa_id", "produto_id");

-- CreateIndex
CREATE INDEX "movimentos_estoque_lote_id_idx" ON "movimentos_estoque"("lote_id");

-- CreateIndex
CREATE INDEX "inventarios_fisicos_empresa_id_idx" ON "inventarios_fisicos"("empresa_id");

-- CreateIndex
CREATE INDEX "itens_inventario_inventario_fisico_id_idx" ON "itens_inventario"("inventario_fisico_id");

-- CreateIndex
CREATE INDEX "tipos_caixa_embalagem_empresa_id_idx" ON "tipos_caixa_embalagem"("empresa_id");

-- CreateIndex
CREATE INDEX "movimentos_comodato_empresa_id_participante_id_idx" ON "movimentos_comodato"("empresa_id", "participante_id");

-- CreateIndex
CREATE INDEX "titulos_financeiros_empresa_id_status_tipo_idx" ON "titulos_financeiros"("empresa_id", "status", "tipo");

-- CreateIndex
CREATE INDEX "titulos_financeiros_participante_id_idx" ON "titulos_financeiros"("participante_id");

-- CreateIndex
CREATE INDEX "baixas_titulo_titulo_financeiro_id_idx" ON "baixas_titulo"("titulo_financeiro_id");

-- CreateIndex
CREATE INDEX "movimentos_caixa_empresa_id_data_idx" ON "movimentos_caixa"("empresa_id", "data");

-- CreateIndex
CREATE INDEX "contas_bancarias_empresa_id_idx" ON "contas_bancarias"("empresa_id");

-- CreateIndex
CREATE INDEX "plano_contas_empresa_id_idx" ON "plano_contas"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "plano_contas_empresa_id_codigo_key" ON "plano_contas"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "centros_custo_empresa_id_idx" ON "centros_custo"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_empresa_id_codigo_key" ON "centros_custo"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "cheques_emitidos_empresa_id_status_idx" ON "cheques_emitidos"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "cheques_terceiros_empresa_id_status_idx" ON "cheques_terceiros"("empresa_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_chave_acesso_key" ON "notas_fiscais"("chave_acesso");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresa_id_status_idx" ON "notas_fiscais"("empresa_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_empresa_id_serie_numero_key" ON "notas_fiscais"("empresa_id", "serie", "numero");

-- CreateIndex
CREATE INDEX "itens_nota_fiscal_nota_fiscal_id_idx" ON "itens_nota_fiscal"("nota_fiscal_id");

-- CreateIndex
CREATE INDEX "itens_nota_fiscal_produto_id_idx" ON "itens_nota_fiscal"("produto_id");

-- CreateIndex
CREATE INDEX "manifestacoes_destinatario_nota_fiscal_id_idx" ON "manifestacoes_destinatario"("nota_fiscal_id");

-- CreateIndex
CREATE UNIQUE INDEX "cfops_codigo_key" ON "cfops"("codigo");

-- CreateIndex
CREATE INDEX "naturezas_operacao_empresa_id_idx" ON "naturezas_operacao"("empresa_id");

-- CreateIndex
CREATE INDEX "certificados_digitais_empresa_id_idx" ON "certificados_digitais"("empresa_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departamentos" ADD CONSTRAINT "departamentos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_medida" ADD CONSTRAINT "unidades_medida_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_unidade_medida_id_fkey" FOREIGN KEY ("unidade_medida_id") REFERENCES "unidades_medida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_icms" ADD CONSTRAINT "regras_icms_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_ipi" ADD CONSTRAINT "regras_ipi_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_pis" ADD CONSTRAINT "regras_pis_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_cofins" ADD CONSTRAINT "regras_cofins_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_ibs" ADD CONSTRAINT "regras_ibs_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_cbs" ADD CONSTRAINT "regras_cbs_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabelas_preco" ADD CONSTRAINT "tabelas_preco_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_tabela_preco" ADD CONSTRAINT "itens_tabela_preco_tabela_preco_id_fkey" FOREIGN KEY ("tabela_preco_id") REFERENCES "tabelas_preco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_tabela_preco" ADD CONSTRAINT "itens_tabela_preco_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicoes_pagamento" ADD CONSTRAINT "condicoes_pagamento_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_condicao_pagamento_id_fkey" FOREIGN KEY ("condicao_pagamento_id") REFERENCES "condicoes_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes" ADD CONSTRAINT "participantes_grupo_empresas_id_fkey" FOREIGN KEY ("grupo_empresas_id") REFERENCES "grupos_empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_vendedor_padrao_id_fkey" FOREIGN KEY ("vendedor_padrao_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_rota_entrega_id_fkey" FOREIGN KEY ("rota_entrega_id") REFERENCES "rotas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tabela_preco_id_fkey" FOREIGN KEY ("tabela_preco_id") REFERENCES "tabelas_preco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_empresas" ADD CONSTRAINT "grupos_empresas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportadoras" ADD CONSTRAINT "transportadoras_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_entrega" ADD CONSTRAINT "rotas_entrega_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rotas_entrega" ADD CONSTRAINT "rotas_entrega_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("participante_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_condicao_pagamento_id_fkey" FOREIGN KEY ("condicao_pagamento_id") REFERENCES "condicoes_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "pedidos_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("participante_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_tabela_preco_id_fkey" FOREIGN KEY ("tabela_preco_id") REFERENCES "tabelas_preco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_condicao_pagamento_id_fkey" FOREIGN KEY ("condicao_pagamento_id") REFERENCES "condicoes_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_rota_entrega_id_fkey" FOREIGN KEY ("rota_entrega_id") REFERENCES "rotas_entrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_venda" ADD CONSTRAINT "itens_pedido_venda_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_venda" ADD CONSTRAINT "itens_pedido_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucoes_venda" ADD CONSTRAINT "devolucoes_venda_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_devolucao_venda" ADD CONSTRAINT "itens_devolucao_venda_devolucao_venda_id_fkey" FOREIGN KEY ("devolucao_venda_id") REFERENCES "devolucoes_venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_devolucao_venda" ADD CONSTRAINT "itens_devolucao_venda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("participante_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "pedidos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_inventario_fisico_id_fkey" FOREIGN KEY ("inventario_fisico_id") REFERENCES "inventarios_fisicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios_fisicos" ADD CONSTRAINT "inventarios_fisicos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios_fisicos" ADD CONSTRAINT "inventarios_fisicos_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_inventario_fisico_id_fkey" FOREIGN KEY ("inventario_fisico_id") REFERENCES "inventarios_fisicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_inventario" ADD CONSTRAINT "itens_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_caixa_embalagem" ADD CONSTRAINT "tipos_caixa_embalagem_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_comodato" ADD CONSTRAINT "movimentos_comodato_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_comodato" ADD CONSTRAINT "movimentos_comodato_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_comodato" ADD CONSTRAINT "movimentos_comodato_tipo_caixa_embalagem_id_fkey" FOREIGN KEY ("tipo_caixa_embalagem_id") REFERENCES "tipos_caixa_embalagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "pedidos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas_titulo" ADD CONSTRAINT "baixas_titulo_titulo_financeiro_id_fkey" FOREIGN KEY ("titulo_financeiro_id") REFERENCES "titulos_financeiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "contas_bancarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias" ADD CONSTRAINT "contas_bancarias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_contas" ADD CONSTRAINT "plano_contas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_contas" ADD CONSTRAINT "plano_contas_conta_pai_id_fkey" FOREIGN KEY ("conta_pai_id") REFERENCES "plano_contas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_custo" ADD CONSTRAINT "centros_custo_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_emitidos" ADD CONSTRAINT "cheques_emitidos_conta_bancaria_id_fkey" FOREIGN KEY ("conta_bancaria_id") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_terceiros" ADD CONSTRAINT "cheques_terceiros_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques_terceiros" ADD CONSTRAINT "cheques_terceiros_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_natureza_operacao_id_fkey" FOREIGN KEY ("natureza_operacao_id") REFERENCES "naturezas_operacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_participante_id_fkey" FOREIGN KEY ("participante_id") REFERENCES "participantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_certificado_digital_id_fkey" FOREIGN KEY ("certificado_digital_id") REFERENCES "certificados_digitais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pedido_compra_id_fkey" FOREIGN KEY ("pedido_compra_id") REFERENCES "pedidos_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_fiscal" ADD CONSTRAINT "itens_nota_fiscal_cfop_id_fkey" FOREIGN KEY ("cfop_id") REFERENCES "cfops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestacoes_destinatario" ADD CONSTRAINT "manifestacoes_destinatario_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "naturezas_operacao" ADD CONSTRAINT "naturezas_operacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "naturezas_operacao" ADD CONSTRAINT "naturezas_operacao_cfop_padrao_id_fkey" FOREIGN KEY ("cfop_padrao_id") REFERENCES "cfops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_digitais" ADD CONSTRAINT "certificados_digitais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
