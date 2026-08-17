-- AlterTable
ALTER TABLE "titulos_financeiros" ADD COLUMN     "titulo_agrupado_id" UUID;

-- CreateTable
CREATE TABLE "nota_fiscal_pedidos_venda" (
    "id" UUID NOT NULL,
    "nota_fiscal_id" UUID NOT NULL,
    "pedido_venda_id" UUID NOT NULL,

    CONSTRAINT "nota_fiscal_pedidos_venda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nota_fiscal_pedidos_venda_pedido_venda_id_idx" ON "nota_fiscal_pedidos_venda"("pedido_venda_id");

-- CreateIndex
CREATE UNIQUE INDEX "nota_fiscal_pedidos_venda_nota_fiscal_id_pedido_venda_id_key" ON "nota_fiscal_pedidos_venda"("nota_fiscal_id", "pedido_venda_id");

-- CreateIndex
CREATE INDEX "titulos_financeiros_titulo_agrupado_id_idx" ON "titulos_financeiros"("titulo_agrupado_id");

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_titulo_agrupado_id_fkey" FOREIGN KEY ("titulo_agrupado_id") REFERENCES "titulos_financeiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_pedidos_venda" ADD CONSTRAINT "nota_fiscal_pedidos_venda_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_pedidos_venda" ADD CONSTRAINT "nota_fiscal_pedidos_venda_pedido_venda_id_fkey" FOREIGN KEY ("pedido_venda_id") REFERENCES "pedidos_venda"("id") ON DELETE CASCADE ON UPDATE CASCADE;
