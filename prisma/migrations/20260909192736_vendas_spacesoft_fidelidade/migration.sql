-- AlterTable
ALTER TABLE "itens_pedido_venda" ADD COLUMN     "impresso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "observacao" TEXT;

-- AlterTable
ALTER TABLE "ocorrencias" ADD COLUMN     "resolucao" TEXT;

-- AlterTable
ALTER TABLE "pedidos_venda" ADD COLUMN     "itinerario_id" UUID;

-- AlterTable
ALTER TABLE "titulos_financeiros" ADD COLUMN     "itinerario_id" UUID;

-- CreateTable
CREATE TABLE "itinerarios" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "periodo" "TurnoEntrega",
    "rota_entrega_id" UUID NOT NULL,
    "transportadora_id" UUID,
    "placa_veiculo" TEXT,
    "valor_frete" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "fatura_gerada" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_ocorrencia" (
    "id" UUID NOT NULL,
    "ocorrencia_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" DECIMAL(14,4) NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL DEFAULT 0,

    CONSTRAINT "itens_ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itinerarios_empresa_id_data_idx" ON "itinerarios"("empresa_id", "data");

-- CreateIndex
CREATE INDEX "itens_ocorrencia_ocorrencia_id_idx" ON "itens_ocorrencia"("ocorrencia_id");

-- AddForeignKey
ALTER TABLE "itinerarios" ADD CONSTRAINT "itinerarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerarios" ADD CONSTRAINT "itinerarios_rota_entrega_id_fkey" FOREIGN KEY ("rota_entrega_id") REFERENCES "rotas_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerarios" ADD CONSTRAINT "itinerarios_transportadora_id_fkey" FOREIGN KEY ("transportadora_id") REFERENCES "transportadoras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_venda" ADD CONSTRAINT "pedidos_venda_itinerario_id_fkey" FOREIGN KEY ("itinerario_id") REFERENCES "itinerarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ocorrencia" ADD CONSTRAINT "itens_ocorrencia_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ocorrencia" ADD CONSTRAINT "itens_ocorrencia_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos_financeiros" ADD CONSTRAINT "titulos_financeiros_itinerario_id_fkey" FOREIGN KEY ("itinerario_id") REFERENCES "itinerarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
