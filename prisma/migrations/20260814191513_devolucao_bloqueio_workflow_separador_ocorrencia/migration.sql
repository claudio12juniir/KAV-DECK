-- CreateEnum
CREATE TYPE "StatusBloqueio" AS ENUM ('SOLICITADO', 'EM_ANALISE', 'AUTORIZADO', 'NEGADO');

-- CreateEnum
CREATE TYPE "TipoBloqueio" AS ENUM ('BLOQUEAR', 'DESBLOQUEAR');

-- AlterEnum
ALTER TYPE "TipoMovimentoEstoque" ADD VALUE 'DEVOLUCAO';

-- AlterTable
ALTER TABLE "pedidos_venda" ADD COLUMN     "separador_id" UUID;

-- CreateTable
CREATE TABLE "bloqueios_financeiros_cliente" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "tipo" "TipoBloqueio" NOT NULL,
    "status" "StatusBloqueio" NOT NULL DEFAULT 'SOLICITADO',
    "motivo" TEXT,
    "solicitado_por_id" UUID,
    "autorizado_por_id" UUID,
    "decidido_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloqueios_financeiros_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "pedido_venda_id" UUID,
    "cliente_id" UUID,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bloqueios_financeiros_cliente_cliente_id_idx" ON "bloqueios_financeiros_cliente"("cliente_id");

-- CreateIndex
CREATE INDEX "ocorrencias_empresa_id_data_idx" ON "ocorrencias"("empresa_id", "data");

-- AddForeignKey
ALTER TABLE "bloqueios_financeiros_cliente" ADD CONSTRAINT "bloqueios_financeiros_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("participante_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_financeiros_cliente" ADD CONSTRAINT "bloqueios_financeiros_cliente_solicitado_por_id_fkey" FOREIGN KEY ("solicitado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_financeiros_cliente" ADD CONSTRAINT "bloqueios_financeiros_cliente_autorizado_por_id_fkey" FOREIGN KEY ("autorizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_separador_id_fkey" FOREIGN KEY ("separador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("participante_id") ON DELETE SET NULL ON UPDATE CASCADE;
