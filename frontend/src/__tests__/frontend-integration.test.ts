/**
 * Frontend Integration Tests
 * @jest-environment node
 *
 * Tests the Next.js frontend application using HTTP requests
 */

import http from 'http';

function makeRequest(url: string, method: string = 'GET'): Promise<{ statusCode: number, headers: any }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve({ statusCode: res.statusCode || 0, headers: res.headers });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

describe('Frontend Integration Tests', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';

  describe('Application Availability', () => {
    it('should have frontend accessible at root path', async () => {
      const response = await makeRequest(`${BASE_URL}/`);
      expect(response.statusCode).toBe(200);
    });

    it('should have content-type header', async () => {
      const response = await makeRequest(`${BASE_URL}/`);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('Static Pages', () => {
    it('should load login page', async () => {
      const response = await makeRequest(`${BASE_URL}/login`);
      expect(response.statusCode).toBe(200);
    });

    it('should load signup page', async () => {
      const response = await makeRequest(`${BASE_URL}/signup`);
      expect(response.statusCode).toBe(200);
    });

    it('should load dashboard page (or redirect if protected)', async () => {
      const response = await makeRequest(`${BASE_URL}/dashboard`);
      // Protected pages may redirect (307) if authentication is required
      expect([200, 307]).toContain(response.statusCode);
    });

    it('should load todos page (or redirect if protected)', async () => {
      const response = await makeRequest(`${BASE_URL}/todos`);
      // Protected pages may redirect (307) if authentication is required
      expect([200, 307]).toContain(response.statusCode);
    });

    it('should load fundflow page (or redirect if protected)', async () => {
      const response = await makeRequest(`${BASE_URL}/fundflow`);
      // Protected pages may redirect (307) if authentication is required
      expect([200, 307]).toContain(response.statusCode);
    });

    it('should load settings page (or redirect if protected)', async () => {
      const response = await makeRequest(`${BASE_URL}/settings`);
      // Protected pages may redirect (307) if authentication is required
      expect([200, 307]).toContain(response.statusCode);
    });
  });

  describe('API Routes (BFF Layer)', () => {
    it('should have auth signup API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/auth/signup`, 'POST');
      // Should exist (not 404) - will be 400/405/401 but not 404
      expect(response.statusCode).not.toBe(404);
    });

    it('should have auth login API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/auth/login`, 'POST');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have auth logout API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/auth/logout`, 'POST');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have auth me API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/auth/me`, 'GET');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have todos lists API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/todos/lists`, 'GET');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have fundflow transactions API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/fundflow/transactions`, 'GET');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });

    it('should have fundflow categories API route (not 404)', async () => {
      const response = await makeRequest(`${BASE_URL}/api/fundflow/categories`, 'GET');
      // Should exist (not 404)
      expect(response.statusCode).not.toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await makeRequest(`${BASE_URL}/non-existent-route-12345`);
      expect(response.statusCode).toBe(404);
    });
  });
});
