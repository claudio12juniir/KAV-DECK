-- AlterTable
ALTER TABLE "configuracoes_fiscais" ADD COLUMN     "inscricao_estadual" TEXT,
ADD COLUMN     "nfeio_state_tax_configurado" BOOLEAN NOT NULL DEFAULT false;
