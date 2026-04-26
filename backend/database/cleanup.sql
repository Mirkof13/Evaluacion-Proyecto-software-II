-- Script de limpieza profunda para BancoSol
-- Elimina índices duplicados y limpia la base de datos de basura generada por alter:true

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Eliminar todos los índices únicos duplicados de todas las tablas
    FOR r IN (
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname ~ '.*_key[0-9]+$'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.indexname);
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
    END LOOP;
END $$;
