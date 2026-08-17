-- AlterEnum
ALTER TYPE "StatusTitulo" ADD VALUE 'SUBSTITUIDO';

-- AlterTable
ALTER TABLE "baixas_titulo" ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "titulos_financeiros" ADD COLUMN     "titulo_origem_id" UUID;

-- CreateIndex
CREATE INDEX "titulos_financeiros_titulo_origem_id_idx" ON "titulos_financeiros"("titulo_origem_id");

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_titulo_origem_id_fkey" FOREIGN KEY ("titulo_origem_id") REFERENCES "titulos_financeiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
