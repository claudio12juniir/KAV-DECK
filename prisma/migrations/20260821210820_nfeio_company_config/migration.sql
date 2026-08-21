-- AlterTable
ALTER TABLE "configuracoes_fiscais" ADD COLUMN     "endereco_bairro" TEXT,
ADD COLUMN     "endereco_cep" TEXT,
ADD COLUMN     "endereco_cidade_codigo_ibge" TEXT,
ADD COLUMN     "endereco_cidade_nome" TEXT,
ADD COLUMN     "endereco_complemento" TEXT,
ADD COLUMN     "endereco_logradouro" TEXT,
ADD COLUMN     "endereco_numero" TEXT,
ADD COLUMN     "endereco_uf" TEXT,
ADD COLUMN     "nfeio_company_id" TEXT,
ADD COLUMN     "regime_tributario" TEXT;
