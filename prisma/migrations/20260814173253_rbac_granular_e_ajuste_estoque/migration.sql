-- AlterEnum
ALTER TYPE "TipoMovimentoEstoque" ADD VALUE 'AJUSTE_MANUAL';

-- AlterTable
ALTER TABLE "movimentos_estoque" ADD COLUMN     "motivo" TEXT,
ADD COLUMN     "usuario_id" UUID;

-- CreateTable
CREATE TABLE "permissoes_usuario" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "modulo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "permitida" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permissoes_usuario_usuario_id_idx" ON "permissoes_usuario"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_usuario_usuario_id_modulo_acao_key" ON "permissoes_usuario"("usuario_id", "modulo", "acao");

-- AddForeignKey
ALTER TABLE "permissoes_usuario" ADD CONSTRAINT "permissoes_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
