-- ====================================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS PARA WHATSAPP API SAAS
-- ====================================================================================
-- Instrucciones:
-- 1. Ve a tu nuevo proyecto de Supabase.
-- 2. Entra a la sección "SQL Editor".
-- 3. Crea una nueva query, pega todo este contenido y dale a "Run".
-- ====================================================================================

-- 1. Tabla de Clientes (Quienes consumen tu API, ej. "App Préstamos" u otros clientes)
CREATE TABLE public.api_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- Nombre de la empresa o aplicación
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de API Keys (Para la autenticación de los clientes)
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) UNIQUE NOT NULL, -- Guardamos un identificador o la key (para mayor seguridad se podría hashear)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para búsquedas rápidas por API Key
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);

-- 3. Tabla de Logs de Mensajes (Para auditoría y facturación)
CREATE TABLE public.message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL, -- Número de destino
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'document', etc.
    content TEXT, -- Contenido del mensaje enviado (Opcional, puede borrarse por privacidad)
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    evolution_message_id VARCHAR(255), -- ID que devuelve Evolution API para rastrear estado
    error_message TEXT, -- Si falla, guardamos el motivo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Función y Trigger para auto-actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_logs_modtime
BEFORE UPDATE ON public.message_logs
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Habilitar Row Level Security (RLS) como buena práctica
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (Por ahora bloqueamos acceso anónimo, solo permitimos acceso con Service Role (Admin) desde tu backend)
CREATE POLICY "Deny all anonymous access" ON public.api_clients FOR ALL TO anon USING (false);
CREATE POLICY "Deny all anonymous access" ON public.api_keys FOR ALL TO anon USING (false);
CREATE POLICY "Deny all anonymous access" ON public.message_logs FOR ALL TO anon USING (false);

-- ====================================================================================
-- DATOS DE PRUEBA INICIALES (Para probar rápidamente)
-- ====================================================================================
-- Insertamos a tu App de Préstamos como primer cliente
INSERT INTO public.api_clients (id, name, email) 
VALUES ('11111111-1111-1111-1111-111111111111', 'App Préstamos', 'admin@appprestamos.com');

-- Le asignamos una API Key de prueba (¡Cambiar en producción!)
INSERT INTO public.api_keys (client_id, key_hash)
VALUES ('11111111-1111-1111-1111-111111111111', 'sk_test_prestamos_123456789');
