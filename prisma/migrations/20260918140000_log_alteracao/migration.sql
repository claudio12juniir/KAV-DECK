-- Histórico genérico de alterações por registro (botão "Logs" de cada linha
-- nas telas de cadastro do Space Soft).

-- CreateEnum
CREATE TYPE "AcaoLog" AS ENUM ('CRIACAO', 'ATUALIZACAO', 'EXCLUSAO');

-- CreateTable
CREATE TABLE "logs_alteracao" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" UUID NOT NULL,
    "acao" "AcaoLog" NOT NULL,
    "usuario_id" UUID,
    "dados" JSONB,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_alteracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_alteracao_empresa_id_entidade_entidade_id_idx" ON "logs_alteracao"("empresa_id", "entidade", "entidade_id");

-- AddForeignKey
ALTER TABLE "logs_alteracao" ADD CONSTRAINT "logs_alteracao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_alteracao" ADD CONSTRAINT "logs_alteracao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
