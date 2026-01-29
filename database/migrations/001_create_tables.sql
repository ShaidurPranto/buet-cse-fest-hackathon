-- Users Table (for Auth Service)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trains Table (for Train Service)
CREATE TABLE IF NOT EXISTS trains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_seats INT NOT NULL
);

CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    train_id INT REFERENCES trains(id),
    source_station_id INT REFERENCES stations(id),
    dest_station_id INT REFERENCES stations(id),
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    fare DECIMAL(10,2) NOT NULL
);

-- Seat Inventory Table
CREATE TABLE IF NOT EXISTS seat_inventory (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'LOCKED', 'BOOKED')),
  locked_by INT,
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seat_inventory_trip_status ON seat_inventory(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_locked_at ON seat_inventory(locked_at) WHERE status = 'LOCKED';

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  trip_id INT NOT NULL,
  seat_numbers JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_trip ON bookings(user_id, trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_status ON bookings(trip_id, status);
