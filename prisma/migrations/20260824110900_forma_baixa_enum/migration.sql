/*
  Warnings:

  - Changed the type of `forma_baixa` on the `baixas_titulo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FormaBaixaTitulo" AS ENUM ('BOLETO', 'DEBITO_AUTOMATICO', 'CARTAO_CREDITO', 'PIX', 'DINHEIRO', 'CHEQUE', 'OUTRO');

-- AlterTable
ALTER TABLE "baixas_titulo" DROP COLUMN "forma_baixa",
ADD COLUMN     "forma_baixa" "FormaBaixaTitulo" NOT NULL;
