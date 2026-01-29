import pool from '../config/db.js';

export async function searchSchedules(req, res) {
  const { from, to } = req.query;

  console.log('Received query:', { from, to });

  if (!from || !to) {
    return res.status(400).json({
      error: 'from and to stations are required'
    });
  }

  try {
    const query = `
      SELECT 
        s.id,
        t.name AS train_name,
        st1.name AS source,
        st2.name AS destination,
        s.departure_time,
        s.arrival_time,
        s.fare
      FROM schedules s
      JOIN trains t ON s.train_id = t.id
      JOIN stations st1 ON s.source_station_id = st1.id
      JOIN stations st2 ON s.dest_station_id = st2.id
      WHERE st1.name = $1 AND st2.name = $2
      ORDER BY s.departure_time;
    `;

    console.log('Executing query with params:', [from, to]);
    const { rows } = await pool.query(query, [from, to]);
    console.log('Query returned:', rows.length, 'rows');

    res.json(rows);

  } catch (err) {
    console.error('DB query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


