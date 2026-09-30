-- Performance Indexes P2
CREATE INDEX IF NOT EXISTS "idx_instalacoes_data_instalacao" ON "instalacoes"("data_instalacao");
CREATE INDEX IF NOT EXISTS "idx_instalacoes_operacao" ON "instalacoes"("operacao");
CREATE INDEX IF NOT EXISTS "idx_retiradas_unidade_id" ON "retiradas"("unidade_id");
CREATE INDEX IF NOT EXISTS "idx_retiradas_modelo_id" ON "retiradas"("modelo_id");
CREATE INDEX IF NOT EXISTS "idx_unidades_clientes_nome" ON "unidades_clientes"("nome_unidade");
CREATE INDEX IF NOT EXISTS "idx_unidades_clientes_uf" ON "unidades_clientes"("uf");
CREATE INDEX IF NOT EXISTS "idx_os_criado_em" ON "ordens_servicos_terceirizados"("criado_em");
CREATE INDEX IF NOT EXISTS "idx_os_data_devolucao" ON "ordens_servicos_terceirizados"("data_devolucao");
CREATE INDEX IF NOT EXISTS "idx_tarefas_status_ordem" ON "tarefas"("status", "ordem");
