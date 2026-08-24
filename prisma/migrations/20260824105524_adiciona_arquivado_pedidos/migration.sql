-- AlterTable
ALTER TABLE "pedidos_compra" ADD COLUMN     "arquivado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pedidos_venda" ADD COLUMN     "arquivado" BOOLEAN NOT NULL DEFAULT false;
