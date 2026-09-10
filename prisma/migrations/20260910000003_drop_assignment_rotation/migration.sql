-- Remove o modo de rodizio (nunca finalizado; tabelas sem uso)
-- (a migracao original criou rotationMode como TEXT, sem tipo enum;
-- IF EXISTS porque as tabelas podem nunca ter sido criadas no banco)
DROP TABLE IF EXISTS "assignment_eligibility_rule";
DROP TABLE IF EXISTS "assignment_settings";
