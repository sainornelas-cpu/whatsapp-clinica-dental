-- Habilitar RLS si no está activado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir a usuarios autenticados leer pacientes
CREATE POLICY IF NOT EXISTS "Authenticated users can read patients"
ON patients FOR SELECT
TO authenticated
USING (true);

-- Crear política para permitir a usuarios autenticados leer citas
CREATE POLICY IF NOT EXISTS "Authenticated users can read appointments"
ON appointments FOR SELECT
TO authenticated
USING (true);

-- Crear política para permitir a usuarios autenticados leer conversaciones
CREATE POLICY IF NOT EXISTS "Authenticated users can read conversations"
ON conversations FOR SELECT
TO authenticated
USING (true);

-- Crear política para permitir a usuarios autenticados leer mensajes
CREATE POLICY IF NOT EXISTS "Authenticated users can read messages"
ON messages FOR SELECT
TO authenticated
USING (true);

-- Crear política para permitir a usuarios autenticados crear pacientes
CREATE POLICY IF NOT EXISTS "Authenticated users can insert patients"
ON patients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política para permitir a usuarios autenticados crear citas
CREATE POLICY IF NOT EXISTS "Authenticated users can insert appointments"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política para permitir a usuarios autenticados crear conversaciones
CREATE POLICY IF NOT EXISTS "Authenticated users can insert conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política para permitir a usuarios autenticados crear mensajes
CREATE POLICY IF NOT EXISTS "Authenticated users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política para permitir a usuarios autenticados actualizar citas
CREATE POLICY IF NOT EXISTS "Authenticated users can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Crear política para permitir a usuarios autenticados actualizar conversaciones
CREATE POLICY IF NOT EXISTS "Authenticated users can update conversations"
ON conversations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Verificar políticas creadas
SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('patients', 'appointments', 'conversations', 'messages')
ORDER BY tablename, policyname;
