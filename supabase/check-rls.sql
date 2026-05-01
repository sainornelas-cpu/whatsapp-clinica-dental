-- Verificar políticas RLS existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('patients', 'appointments', 'conversations', 'messages')
ORDER BY tablename, policyname;

-- Verificar si RLS está activado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'appointments', 'conversations', 'messages');
