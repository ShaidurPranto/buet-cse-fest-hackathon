-- Seed Users (for Auth Service)
INSERT INTO users (email, password)
VALUES 
  ('user1@example.com', '$2b$10$I.QNPfuCQkDyN2QzHx6eOOr1c4F5Cdt0VLb2Q.8MBX9UKO5DQHc0O'),
  ('user2@example.com', '$2b$10$I.QNPfuCQkDyN2QzHx6eOOr1c4F5Cdt0VLb2Q.8MBX9UKO5DQHc0O'),
  ('user3@example.com', '$2b$10$I.QNPfuCQkDyN2QzHx6eOOr1c4F5Cdt0VLb2Q.8MBX9UKO5DQHc0O')
ON CONFLICT (email) DO NOTHING;

-- Seed Stations
INSERT INTO stations (name)
VALUES ('Dhaka'), ('Chittagong')
ON CONFLICT DO NOTHING;

INSERT INTO trains (name, total_seats)
VALUES ('Sonar Bangla Express', 500)
ON CONFLICT DO NOTHING;

INSERT INTO schedules (
    train_id,
    source_station_id,
    dest_station_id,
    departure_time,
    arrival_time,
    fare
)
SELECT
    t.id,
    s1.id,
    s2.id,
    '2026-02-01 07:00',
    '2026-02-01 13:00',
    1200.00
FROM trains t, stations s1, stations s2
WHERE
    t.name = 'Sonar Bangla Express'
    AND s1.name = 'Dhaka'
    AND s2.name = 'Chittagong'
ON CONFLICT DO NOTHING;
