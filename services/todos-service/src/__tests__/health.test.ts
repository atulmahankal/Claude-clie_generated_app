import request from 'supertest';

/**
 * Todos Service Health Endpoint Tests
 */

describe('Todos Service - Health Endpoint Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

  describe('GET /health', () => {
    it('should return 200 status code', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return healthy status', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('status', 'healthy');
    });

    it('should include service name', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('service', 'todos-service');
    });

    it('should include version information', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('version');
    });

    it('should have passing database health check', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks.database).toHaveProperty('status', 'pass');
    });

    it('should have passing memory health check', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body.checks).toHaveProperty('memory');
      expect(response.body.checks.memory).toHaveProperty('status', 'pass');
    });
  });

  describe('GET / (root)', () => {
    it('should return 200 status code', async () => {
      const response = await request(BASE_URL).get('/');
      expect(response.status).toBe(200);
    });

    it('should return service information', async () => {
      const response = await request(BASE_URL).get('/');
      expect(response.body).toHaveProperty('service', 'todos-service');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });
});
