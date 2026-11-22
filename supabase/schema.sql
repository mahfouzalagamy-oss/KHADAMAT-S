-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_company BOOLEAN DEFAULT false,
  specialty TEXT,
  category_ids TEXT[],
  area TEXT,
  primary_center TEXT,
  covered_centers TEXT[],
  covered_areas TEXT[],
  documents JSONB,
  is_verified_docs BOOLEAN DEFAULT false,
  is_phone_verified BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  years_exp INTEGER DEFAULT 0,
  phone TEXT,
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id TEXT PRIMARY KEY,
  reference_code TEXT UNIQUE NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  service_title TEXT NOT NULL,
  detailed_description TEXT,
  district TEXT NOT NULL,
  address_text TEXT,
  preferred_date TEXT,
  preferred_time TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  payment_method TEXT,
  wallet_provider TEXT,
  customer_lat DECIMAL(10,7),
  customer_lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_at_timestamp BIGINT,
  en_route_started_at BIGINT,
  completed_at_timestamp BIGINT
);

-- Service Quotes table
CREATE TABLE IF NOT EXISTS service_quotes (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
  technician_id TEXT REFERENCES technicians(id),
  technician_name TEXT NOT NULL,
  price_egp INTEGER NOT NULL,
  estimated_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_role TEXT NOT NULL,
  recipient_tech_id TEXT REFERENCES technicians(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  request_id TEXT REFERENCES service_requests(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  technician_id TEXT REFERENCES technicians(id),
  customer_name TEXT NOT NULL,
  area TEXT,
  service_title TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rating_breakdown JSONB,
  review TEXT,
  date_label TEXT,
  price_egp INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technician Locations (for live GPS tracking)
CREATE TABLE IF NOT EXISTS technician_locations (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
  technician_id TEXT REFERENCES technicians(id),
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow public read/write for now (tighten later)
CREATE POLICY "Allow public read" ON technicians FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON technicians FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON technicians FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON service_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON service_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON service_quotes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON service_quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON service_quotes FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON notifications FOR UPDATE USING (true);

CREATE POLICY "Allow public read" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON technician_locations FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON technician_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON technician_locations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON technician_locations FOR DELETE USING (true);

-- Messages table (for chat between customer and technician)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES service_requests(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON messages FOR INSERT WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE service_quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE technician_locations;