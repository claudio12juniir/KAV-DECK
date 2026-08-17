-- CreateEnum
CREATE TYPE "ModeloDocumentoNF" AS ENUM ('NFE', 'NFCE', 'NF_FORMULARIO');

-- CreateEnum
CREATE TYPE "AmbienteFiscal" AS ENUM ('HOMOLOGACAO', 'PRODUCAO');

-- AlterTable
ALTER TABLE "notas_fiscais" ADD COLUMN     "modelo_documento" "ModeloDocumentoNF" NOT NULL DEFAULT 'NFE';

-- CreateTable
CREATE TABLE "configuracoes_fiscais" (
    "id" UUID NOT NULL,
    "empresa_id" UUID NOT NULL,
    "ambiente" "AmbienteFiscal" NOT NULL DEFAULT 'HOMOLOGACAO',
    "serie_nfe_padrao" TEXT NOT NULL DEFAULT '1',
    "serie_nfce_padrao" TEXT NOT NULL DEFAULT '1',
    "csc_id" TEXT,
    "csc_token" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_fiscais_empresa_id_key" ON "configuracoes_fiscais"("empresa_id");

-- AddForeignKey
ALTER TABLE "configuracoes_fiscais" ADD CONSTRAINT "configuracoes_fiscais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
