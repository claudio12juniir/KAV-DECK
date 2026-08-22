-- CreateEnum
CREATE TYPE "StatusAssinaturaEmpresa" AS ENUM ('AGUARDANDO_PAGAMENTO', 'ATIVA', 'INADIMPLENTE', 'SUSPENSA');

-- CreateEnum
CREATE TYPE "StatusPontoAcesso" AS ENUM ('ATIVO', 'CANCELAMENTO_AGENDADO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoPontoAcesso" AS ENUM ('PRINCIPAL', 'EXTRA');

-- CreateTable
CREATE TABLE "assinaturas_empresa" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "mp_preapproval_id" TEXT,
    "mp_payer_id" TEXT,
    "status" "StatusAssinaturaEmpresa" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "proxima_cobranca" DATE,
    "data_vencimento_atual" DATE,
    "ultimo_pagamento_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assinaturas_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_acesso" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "tipo" "TipoPontoAcesso" NOT NULL,
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "status" "StatusPontoAcesso" NOT NULL DEFAULT 'ATIVO',
    "data_fim_vigencia" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_empresa_empresa_id_key" ON "assinaturas_empresa"("empresa_id");

-- CreateIndex
CREATE INDEX "pontos_acesso_empresa_id_status_idx" ON "pontos_acesso"("empresa_id", "status");

-- AddForeignKey
ALTER TABLE "assinaturas_empresa" ADD CONSTRAINT "assinaturas_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pontos_acesso" ADD CONSTRAINT "pontos_acesso_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
