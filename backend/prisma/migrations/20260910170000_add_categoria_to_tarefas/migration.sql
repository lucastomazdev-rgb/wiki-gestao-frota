-- AlterTable
ALTER TABLE "tarefas" ADD COLUMN IF NOT EXISTS "categoria" VARCHAR(50);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_tarefas_categoria" ON "tarefas"("categoria");
