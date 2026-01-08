-- =============================================
-- SCHEMA DE BASE DE DATOS PARA SHOPPYJUAN
-- Ejecutar este SQL en el SQL Editor de Supabase
-- =============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: profiles (perfiles de usuario)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLA: shopping_lists (listas de compra)
-- =============================================
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por código de compartir
CREATE INDEX idx_shopping_lists_share_code ON shopping_lists(share_code);

-- =============================================
-- TABLA: list_items (items de la lista)
-- =============================================
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  added_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para obtener items por lista
CREATE INDEX idx_list_items_list_id ON list_items(list_id);

-- =============================================
-- TABLA: list_collaborators (colaboradores)
-- =============================================
CREATE TABLE list_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- Índices para colaboradores
CREATE INDEX idx_list_collaborators_list_id ON list_collaborators(list_id);
CREATE INDEX idx_list_collaborators_user_id ON list_collaborators(user_id);

-- =============================================
-- TABLA: supermarkets (supermercados)
-- =============================================
CREATE TABLE supermarkets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  municipality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice geográfico para búsqueda por ubicación
CREATE INDEX idx_supermarkets_location ON supermarkets(latitude, longitude);
CREATE INDEX idx_supermarkets_municipality ON supermarkets(municipality);

-- =============================================
-- TABLA: product_prices (precios de productos)
-- =============================================
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supermarket_id UUID NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  unit TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda de precios
CREATE INDEX idx_product_prices_supermarket ON product_prices(supermarket_id);
CREATE INDEX idx_product_prices_product_name ON product_prices(product_name);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE supermarkets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para shopping_lists
CREATE POLICY "Users can view their own lists" ON shopping_lists
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM list_collaborators
      WHERE list_id = shopping_lists.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own lists" ON shopping_lists
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their lists" ON shopping_lists
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their lists" ON shopping_lists
  FOR DELETE USING (owner_id = auth.uid());

-- Políticas para list_items
CREATE POLICY "Users can view items from their lists" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_items.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add items to their lists" ON list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_items.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid() AND role = 'editor'
        )
      )
    )
  );

CREATE POLICY "Users can update items in their lists" ON list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_items.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid() AND role = 'editor'
        )
      )
    )
  );

CREATE POLICY "Users can delete items from their lists" ON list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_items.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid() AND role = 'editor'
        )
      )
    )
  );

-- Políticas para list_collaborators
CREATE POLICY "Users can view collaborators of their lists" ON list_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_collaborators.list_id AND owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Owners can add collaborators" ON list_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_collaborators.list_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can remove collaborators" ON list_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_collaborators.list_id AND owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Políticas para supermarkets (lectura pública)
CREATE POLICY "Anyone can view supermarkets" ON supermarkets
  FOR SELECT USING (true);

-- Políticas para product_prices (lectura pública)
CREATE POLICY "Anyone can view product prices" ON product_prices
  FOR SELECT USING (true);

-- =============================================
-- FUNCIONES PARA TIEMPO REAL
-- =============================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at
  BEFORE UPDATE ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HABILITAR REALTIME
-- =============================================

-- Habilitar publicación en tiempo real para las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE list_collaborators;
