-- CreateTable
CREATE TABLE IF NOT EXISTS "falhas_lotes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data_extracao" DATE NOT NULL,
    "descricao" VARCHAR(255),
    "total_veiculos" INTEGER NOT NULL DEFAULT 0,
    "novas_falhas" INTEGER NOT NULL DEFAULT 0,
    "recorrentes" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "falhas_lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "falhas_registros" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lote_id" UUID NOT NULL,
    "placa" VARCHAR(30) NOT NULL,
    "unidade" VARCHAR(100),
    "uf" VARCHAR(10),
    "tipo_veiculo" VARCHAR(100),
    "modulo" VARCHAR(100),
    "ultima_transmissao" TIMESTAMPTZ(6),
    "nivel_bateria" VARCHAR(50),
    "tipo_falha" VARCHAR(50) NOT NULL DEFAULT 'NOVA FALHA',
    "status_tratativa" VARCHAR(100) NOT NULL DEFAULT 'Pendente de Contato',
    "ordem_servico" VARCHAR(100),
    "data_contato" DATE,
    "observacao" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "falhas_registros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_falhas_lotes_data" ON "falhas_lotes"("data_extracao");
CREATE INDEX IF NOT EXISTS "idx_falhas_lotes_data" ON "falhas_lotes"("data_extracao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_lote" ON "falhas_registros"("lote_id");
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_placa" ON "falhas_registros"("placa");
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_status" ON "falhas_registros"("status_tratativa");
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_unidade" ON "falhas_registros"("unidade");
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_uf" ON "falhas_registros"("uf");
CREATE INDEX IF NOT EXISTS "idx_falhas_reg_lote_unidade" ON "falhas_registros"("lote_id", "unidade");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'falhas_registros_lote_id_fkey') THEN
        ALTER TABLE "falhas_registros" ADD CONSTRAINT "falhas_registros_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "falhas_lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
