import request from 'supertest';

/**
 * Health Endpoint Integration Tests
 *
 * Tests the /health endpoint to ensure the service is running correctly
 * and all health checks are passing.
 */

describe('Health Endpoint Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3011';

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
      expect(response.body).toHaveProperty('service', 'auth-service');
    });

    it('should include version information', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('version');
      expect(typeof response.body.version).toBe('string');
    });

    it('should include timestamp', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include uptime', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should include health checks', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toBeInstanceOf(Object);
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

    it('should include response time for checks', async () => {
      const response = await request(BASE_URL).get('/health');
      expect(response.body.checks.database).toHaveProperty('responseTime');
      expect(typeof response.body.checks.database.responseTime).toBe('number');
    });
  });

  describe('GET /liveness', () => {
    it('should return 200 status code', async () => {
      const response = await request(BASE_URL).get('/liveness');
      expect(response.status).toBe(200);
    });

    it('should indicate service is alive', async () => {
      const response = await request(BASE_URL).get('/liveness');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET /readiness', () => {
    it('should return 200 status code when ready', async () => {
      const response = await request(BASE_URL).get('/readiness');
      expect(response.status).toBe(200);
    });

    it('should indicate service is ready', async () => {
      const response = await request(BASE_URL).get('/readiness');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('GET / (root)', () => {
    it('should return 200 status code', async () => {
      const response = await request(BASE_URL).get('/');
      expect(response.status).toBe(200);
    });

    it('should return service information', async () => {
      const response = await request(BASE_URL).get('/');
      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });
});
