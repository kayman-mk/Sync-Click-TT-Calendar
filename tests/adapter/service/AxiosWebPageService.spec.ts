import { AxiosWebPageService } from '../../../src/adapter/service/AxiosWebPageService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AxiosWebPageService', () => {
    let service: AxiosWebPageService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new AxiosWebPageService();
    });

    describe('fetchPage', () => {
        it('should_fetch_page_successfully_when_url_is_valid', async () => {
            const url = 'http://example.com/page';
            const htmlContent = '<html><body>Test Content</body></html>';

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockResolvedValueOnce({ data: htmlContent })
            } as any);

            service = new AxiosWebPageService();
            const result = await service.fetchPage(url);

            expect(result).toBe(htmlContent);
        });

        it('should_throw_error_when_axios_request_fails', async () => {
            const url = 'http://example.com/invalid';
            const errorMessage = 'Network error';

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockRejectedValueOnce(new Error(errorMessage))
            } as any);

            service = new AxiosWebPageService();

            await expect(service.fetchPage(url)).rejects.toThrow(errorMessage);
        });

        it('should_include_url_in_error_message_on_failure', async () => {
            const url = 'http://example.com/fail';

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockRejectedValueOnce(new Error('Connection refused'))
            } as any);

            mockedAxios.isAxiosError.mockReturnValue(true);

            service = new AxiosWebPageService();

            try {
                await service.fetchPage(url);
                fail('Should have thrown an error');
            } catch (error) {
                expect((error as Error).message).toContain(url);
            }
        });
    });

    describe('fetchPageWithHeaders', () => {
        it('should_fetch_page_with_custom_headers_when_provided', async () => {
            const url = 'http://example.com/api';
            const htmlContent = '<html><body>API Response</body></html>';
            const headers = { 'Authorization': 'Bearer token123', 'User-Agent': 'Custom Agent' };
            const mockGet = jest.fn().mockResolvedValueOnce({ data: htmlContent });

            mockedAxios.create.mockReturnValue({
                get: mockGet
            } as any);

            service = new AxiosWebPageService();
            const result = await service.fetchPageWithHeaders(url, headers);

            expect(result).toBe(htmlContent);
            expect(mockGet).toHaveBeenCalledWith(url, { headers });
        });

        it('should_fetch_page_without_headers_when_not_provided', async () => {
            const url = 'http://example.com/page';
            const htmlContent = '<html><body>Content</body></html>';
            const mockGet = jest.fn().mockResolvedValueOnce({ data: htmlContent });

            mockedAxios.create.mockReturnValue({
                get: mockGet
            } as any);

            service = new AxiosWebPageService();
            const result = await service.fetchPageWithHeaders(url);

            expect(result).toBe(htmlContent);
            expect(mockGet).toHaveBeenCalledWith(url, { headers: {} });
        });

        it('should_throw_error_with_descriptive_message_when_axios_error_occurs', async () => {
            const url = 'http://example.com/error';
            const errorMessage = 'Request timeout';
            const axiosError = new Error(errorMessage);

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockRejectedValueOnce(axiosError)
            } as any);

            mockedAxios.isAxiosError.mockReturnValue(true);

            service = new AxiosWebPageService();

            await expect(service.fetchPageWithHeaders(url)).rejects.toThrow();
        });

        it('should_handle_non_axios_errors_gracefully', async () => {
            const url = 'http://example.com/error';
            const error = new TypeError('Unexpected error');

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockRejectedValueOnce(error)
            } as any);

            mockedAxios.isAxiosError.mockReturnValue(false);

            service = new AxiosWebPageService();

            await expect(service.fetchPageWithHeaders(url)).rejects.toThrow(error);
        });

        it('should_preserve_content_encoding_for_html_pages', async () => {
            const url = 'http://example.com/utf8';
            const htmlContent = '<html><meta charset="UTF-8"><body>Äöü</body></html>';

            mockedAxios.create.mockReturnValue({
                get: jest.fn().mockResolvedValueOnce({ data: htmlContent })
            } as any);

            service = new AxiosWebPageService();
            const result = await service.fetchPageWithHeaders(url);

            expect(result).toBe(htmlContent);
            expect(result).toContain('Äöü');
        });
    });
});

