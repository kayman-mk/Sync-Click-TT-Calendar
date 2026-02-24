import { AxiosWebPageService } from '../../../src/adapter/service/AxiosWebPageService';
import { createServer, Server } from 'http';

describe('AxiosWebPageService - Integration Tests with Real Web Server', () => {
    let service: AxiosWebPageService;
    let server: Server;
    let baseUrl: string;

    beforeAll((done) => {
        // Create a real HTTP server for testing
        server = createServer((req, res) => {
            if (req.url === '/success') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><body>Success Content</body></html>');
            } else if (req.url === '/with-special-chars') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><body>Special Characters: Äöü, 中文, العربية</body></html>');
            } else if (req.url === '/json-content') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{"message": "JSON Response"}');
            } else if (req.url === '/custom-headers') {
                const authHeader = req.headers['authorization'];
                if (authHeader === 'Bearer test-token') {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<html><body>Authenticated Content</body></html>');
                } else {
                    res.writeHead(401, { 'Content-Type': 'text/plain' });
                    res.end('Unauthorized');
                }
            } else if (req.url === '/not-found') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Page Not Found');
            } else if (req.url === '/server-error') {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else if (req.url === '/large-content') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                const largeContent = '<html><body>' + 'x'.repeat(100000) + '</body></html>';
                res.end(largeContent);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<html><body>Default Response</body></html>');
            }
        });

        server.listen(0, 'localhost', () => {
            const address = server.address();
            if (address && typeof address !== 'string') {
                baseUrl = `http://localhost:${address.port}`;
            }
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach(() => {
        service = new AxiosWebPageService();
    });

    describe('fetchPage', () => {
        it('should_fetch_page_successfully_when_url_is_valid_from_real_server', async () => {
            const url = `${baseUrl}/success`;
            const result = await service.fetchPage(url);

            expect(result).toBe('<html><body>Success Content</body></html>');
            expect(result).toContain('Success Content');
        });

        it('should_fetch_html_content_with_special_characters_from_real_server', async () => {
            const url = `${baseUrl}/with-special-chars`;
            const result = await service.fetchPage(url);

            expect(result).toContain('Äöü');
            expect(result).toContain('中文');
            expect(result).toContain('العربية');
        });

        it('should_preserve_content_type_for_json_responses_from_real_server', async () => {
            const url = `${baseUrl}/json-content`;
            const result = await service.fetchPage(url);

            // The result should be either a JSON string or an already-parsed object
            expect(typeof result === 'string' || typeof result === 'object').toBe(true);

            // Normalize to an object so we can assert on the JSON structure
            const payload = typeof result === 'string' ? JSON.parse(result) : result as Record<string, unknown>;

            expect(payload).toHaveProperty('message', 'JSON Response');
        });

        it('should_throw_error_when_server_returns_404_from_real_server', async () => {
            const url = `${baseUrl}/not-found`;

            await expect(service.fetchPage(url)).rejects.toThrow();
        });

        it('should_throw_error_when_server_returns_500_from_real_server', async () => {
            const url = `${baseUrl}/server-error`;

            await expect(service.fetchPage(url)).rejects.toThrow();
        });

        it('should_throw_error_with_url_in_message_when_request_fails_from_real_server', async () => {
            const url = `${baseUrl}/server-error`;

            try {
                await service.fetchPage(url);
                fail('Should have thrown an error');
            } catch (error) {
                expect((error as Error).message).toContain(url);
            }
        });

        it('should_throw_error_when_connecting_to_invalid_host', async () => {
            const invalidUrl = 'http://invalid-host-that-does-not-exist-12345.example.local:9999';

            await expect(service.fetchPage(invalidUrl)).rejects.toThrow();
        });
    });

    describe('fetchPageWithHeaders', () => {
        it('should_fetch_page_with_custom_headers_from_real_server', async () => {
            const url = `${baseUrl}/custom-headers`;
            const headers = { 'Authorization': 'Bearer test-token' };
            const result = await service.fetchPageWithHeaders(url, headers);

            expect(result).toContain('Authenticated Content');
        });

        it('should_respect_authorization_headers_from_real_server', async () => {
            const url = `${baseUrl}/custom-headers`;
            const headersWithoutAuth = {};

            await expect(service.fetchPageWithHeaders(url, headersWithoutAuth)).rejects.toThrow();
        });

        it('should_fetch_page_without_custom_headers_from_real_server', async () => {
            const url = `${baseUrl}/success`;
            const result = await service.fetchPageWithHeaders(url);

            expect(result).toContain('Success Content');
        });

        it('should_handle_multiple_custom_headers_from_real_server', async () => {
            const url = `${baseUrl}/custom-headers`;
            const headers = {
                'Authorization': 'Bearer test-token',
                'X-Custom-Header': 'custom-value',
                'User-Agent': 'Test Agent 1.0'
            };
            const result = await service.fetchPageWithHeaders(url, headers);

            expect(result).toContain('Authenticated Content');
        });

        it('should_throw_error_with_descriptive_message_when_custom_headers_fail_from_real_server', async () => {
            const url = `${baseUrl}/custom-headers`;
            const invalidHeaders = { 'Authorization': 'Bearer invalid-token' };

            try {
                await service.fetchPageWithHeaders(url, invalidHeaders);
                fail('Should have thrown an error');
            } catch (error) {
                expect((error as Error).message).toBeDefined();
            }
        });
    });

    describe('Real-world scenarios', () => {
        it('should_handle_sequential_requests_from_real_server', async () => {
            const url = `${baseUrl}/success`;

            const result1 = await service.fetchPage(url);
            const result2 = await service.fetchPage(url);
            const result3 = await service.fetchPage(url);

            expect(result1).toBe(result2);
            expect(result2).toBe(result3);
        });

        it('should_handle_concurrent_requests_from_real_server', async () => {
            const url = `${baseUrl}/success`;

            const results = await Promise.all([
                service.fetchPage(url),
                service.fetchPage(url),
                service.fetchPage(url),
                service.fetchPage(url)
            ]);

            expect(results).toHaveLength(4);
            results.forEach(result => {
                expect(result).toContain('Success Content');
            });
        });

        it('should_handle_mixed_concurrent_requests_from_real_server', async () => {
            const successUrl = `${baseUrl}/success`;
            const jsonUrl = `${baseUrl}/json-content`;
            const specialUrl = `${baseUrl}/with-special-chars`;

            const results = await Promise.all([
                service.fetchPage(successUrl),
                service.fetchPage(jsonUrl),
                service.fetchPageWithHeaders(specialUrl, { 'User-Agent': 'Test' })
            ]);

            // Axios automatically parses JSON responses, so normalize to string for assertion
            expect(results[0]).toContain('Success Content');

            const jsonResult = typeof results[1] === 'string' ? results[1] : JSON.stringify(results[1]);
            expect(jsonResult).toContain('JSON Response');

            expect(results[2]).toContain('Äöü');
        });

        it('should_handle_rapid_requests_from_real_server', async () => {
            const url = `${baseUrl}/success`;
            const promises = [];

            for (let i = 0; i < 10; i++) {
                promises.push(service.fetchPage(url));
            }

            const results = await Promise.all(promises);

            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result).toContain('Success Content');
            });
        });
    });
});

