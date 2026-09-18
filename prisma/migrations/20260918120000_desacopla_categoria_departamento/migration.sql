-- Desacopla Categoria de Departamento (no Space Soft original as duas são
-- classificações independentes do produto, não uma hierarquia) e adiciona
-- "ativo" em ambos, replicando a tela real de Cadastros > Categorias.

-- 1) "ativo" em departamentos e categorias
ALTER TABLE "departamentos" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categorias" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- 2) produtos passa a ter departamento_id próprio (antes vinha só via categoria)
ALTER TABLE "produtos" ADD COLUMN "departamento_id" UUID;

-- 3) backfill: cada produto herda o departamento que sua categoria tinha
UPDATE "produtos" p
SET "departamento_id" = c."departamento_id"
FROM "categorias" c
WHERE p."categoria_id" = c."id";

-- 4) agora que todo produto tem departamento, torna a coluna obrigatória
ALTER TABLE "produtos" ALTER COLUMN "departamento_id" SET NOT NULL;

CREATE INDEX "produtos_departamento_id_idx" ON "produtos"("departamento_id");

ALTER TABLE "produtos" ADD CONSTRAINT "produtos_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) remove o vínculo antigo categoria -> departamento
ALTER TABLE "categorias" DROP CONSTRAINT "categorias_departamento_id_fkey";
DROP INDEX "categorias_departamento_id_idx";
ALTER TABLE "categorias" DROP COLUMN "departamento_id";
