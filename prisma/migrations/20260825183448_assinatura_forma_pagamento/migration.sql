-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('CARTAO', 'PIX', 'BOLETO');

-- AlterTable
ALTER TABLE "assinaturas_empresa" ADD COLUMN     "aviso_atraso_enviado_em" TIMESTAMP(3),
ADD COLUMN     "cpf_responsavel" TEXT,
ADD COLUMN     "fatura_boleto_linha" TEXT,
ADD COLUMN     "fatura_boleto_url" TEXT,
ADD COLUMN     "fatura_mp_payment_id" TEXT,
ADD COLUMN     "fatura_pix_copia_cola" TEXT,
ADD COLUMN     "fatura_pix_qr_code_base64" TEXT,
ADD COLUMN     "fatura_vencimento" DATE,
ADD COLUMN     "forma_pagamento" "FormaPagamento" NOT NULL DEFAULT 'CARTAO';
