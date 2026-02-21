import { injectable } from "inversify";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { WebPageService } from "../../domain/service/WebPageService";

/**
 * Implementation of WebPageService using Axios HTTP client.
 * Provides a unified interface for fetching web pages with proper error handling.
 */
@injectable()
export class AxiosWebPageService implements WebPageService {
    private readonly axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 300
        });
    }

    async fetchPage(url: string): Promise<string> {
        return this.fetchPageWithHeaders(url);
    }

    async fetchPageWithHeaders(url: string, headers?: Record<string, string>): Promise<string> {
        try {
            const config: AxiosRequestConfig = {
                headers: headers || {}
            };
            const response = await this.axiosInstance.get<string>(url, config);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = `Failed to fetch page from ${url}: ${error.message}`;
                throw new Error(message);
            }
            throw error;
        }
    }
}

