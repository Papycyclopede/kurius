/*
  # Schéma Initial Kurius

  1. Tables Principales
    - `profiles` - Profils utilisateurs avec goûts culturels
    - `circles` - Cercles privés (famille, amis)
    - `circle_members` - Membres des cercles
    - `cultural_events` - RDV Culturels
    - `event_participants` - Participants aux événements
    - `recommendations` - Recommandations générées par l'IA
    - `votes` - Votes des participants
    - `memories` - Souvenirs culturels archivés

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques pour l'accès aux données privées
    - Authentification requise pour toutes les opérations
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  favorite_films text[] DEFAULT '{}',
  favorite_books text[] DEFAULT '{}',
  favorite_musics text[] DEFAULT '{}',
  favorite_restaurants text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des cercles privés
CREATE TABLE IF NOT EXISTS circles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  avatar_emoji text DEFAULT '🏠',
  color text DEFAULT '#E8B86D',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des membres des cercles
CREATE TABLE IF NOT EXISTS circle_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

-- Table des événements culturels
CREATE TABLE IF NOT EXISTS cultural_events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'voting', 'completed', 'cancelled')),
  event_type text DEFAULT 'film' CHECK (event_type IN ('film', 'book', 'music', 'restaurant')),
  scheduled_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des participants aux événements
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES cultural_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  has_voted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Table des recommandations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES cultural_events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  poster_url text,
  gemini_explanation text,
  qloo_score numeric DEFAULT 0,
  external_id text, -- ID TMDb, Google Books, etc.
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table des votes
CREATE TABLE IF NOT EXISTS votes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES cultural_events(id) ON DELETE CASCADE NOT NULL,
  recommendation_id uuid REFERENCES recommendations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Table des souvenirs
CREATE TABLE IF NOT EXISTS memories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES cultural_events(id) ON DELETE CASCADE NOT NULL,
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  photos text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour circles
CREATE POLICY "Users can read circles they belong to"
  ON circles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create circles"
  ON circles
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Circle creators can update their circles"
  ON circles
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- Politiques RLS pour circle_members
CREATE POLICY "Users can read members of their circles"
  ON circle_members
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join circles"
  ON circle_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour cultural_events
CREATE POLICY "Users can read events from their circles"
  ON cultural_events
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their circles"
  ON cultural_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid() AND
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

-- Politiques RLS pour event_participants
CREATE POLICY "Users can read participants of events they're in"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM cultural_events 
      WHERE circle_id IN (
        SELECT circle_id FROM circle_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can participate in events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour recommendations
CREATE POLICY "Users can read recommendations for their events"
  ON recommendations
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM cultural_events 
      WHERE circle_id IN (
        SELECT circle_id FROM circle_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Politiques RLS pour votes
CREATE POLICY "Users can read votes for their events"
  ON votes
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM cultural_events 
      WHERE circle_id IN (
        SELECT circle_id FROM circle_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can vote in their events"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    event_id IN (
      SELECT ep.event_id FROM event_participants ep
      WHERE ep.user_id = auth.uid()
    )
  );

-- Politiques RLS pour memories
CREATE POLICY "Users can read memories from their circles"
  ON memories
  FOR SELECT
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members 
      WHERE user_id = auth.uid()
    )
  );

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON circles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON cultural_events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();