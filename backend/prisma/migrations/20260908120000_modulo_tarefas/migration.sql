-- CreateTable
CREATE TABLE IF NOT EXISTS "tarefas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Demandas',
    "criado_por" TEXT NOT NULL,
    "atribuido_a" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "prioridade" VARCHAR(30) NOT NULL DEFAULT 'Normal',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tarefa_comentarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tarefa_id" UUID NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tarefa_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_tarefas_criado_por" ON "tarefas"("criado_por");
CREATE INDEX IF NOT EXISTS "idx_tarefas_atribuido_a" ON "tarefas"("atribuido_a");
CREATE INDEX IF NOT EXISTS "idx_tarefas_status" ON "tarefas"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_comentarios_tarefa_id" ON "tarefa_comentarios"("tarefa_id");
CREATE INDEX IF NOT EXISTS "idx_comentarios_usuario_id" ON "tarefa_comentarios"("usuario_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarefas_criado_por_fkey') THEN
        ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarefas_atribuido_a_fkey') THEN
        ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_atribuido_a_fkey" FOREIGN KEY ("atribuido_a") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarefa_comentarios_tarefa_id_fkey') THEN
        ALTER TABLE "tarefa_comentarios" ADD CONSTRAINT "tarefa_comentarios_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarefa_comentarios_usuario_id_fkey') THEN
        ALTER TABLE "tarefa_comentarios" ADD CONSTRAINT "tarefa_comentarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
