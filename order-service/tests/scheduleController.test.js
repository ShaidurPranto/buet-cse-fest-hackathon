import { searchSchedules } from '../src/controllers/scheduleController.js';
import pool from '../src/config/db.js';

jest.mock('../src/config/db.js');

describe('Schedule Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 if from or to is missing', async () => {
    req.query = { from: 'Dhaka' };
    
    await searchSchedules(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'from and to stations are required'
    });
  });

  test('should return schedules when valid from and to are provided', async () => {
    const mockSchedules = [
      {
        id: 1,
        train_name: 'Sonar Bangla Express',
        source: 'Dhaka',
        destination: 'Chittagong',
        departure_time: '2026-02-01 07:00',
        arrival_time: '2026-02-01 13:00',
        fare: '1200.00'
      }
    ];

    pool.query.mockResolvedValueOnce({ rows: mockSchedules });
    req.query = { from: 'Dhaka', to: 'Chittagong' };
    
    await searchSchedules(req, res);
    
    expect(res.json).toHaveBeenCalledWith(mockSchedules);
  });

  test('should return 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    req.query = { from: 'Dhaka', to: 'Chittagong' };
    
    await searchSchedules(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
