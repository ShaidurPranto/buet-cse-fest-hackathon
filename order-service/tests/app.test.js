import app from '../src/app.js';

describe('Train Service App', () => {
  test('app should be defined', () => {
    expect(app).toBeDefined();
  });

  test('express app should be a function', () => {
    expect(typeof app).toBe('function');
  });
});
