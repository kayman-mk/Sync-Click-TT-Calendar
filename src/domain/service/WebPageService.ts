/**
 * Service to fetch and parse web pages.
 * Abstracts HTTP communication and provides unified access to remote web content.
 */
export interface WebPageService {
    /**
     * Fetch the content of a web page from a given URL.
     * @param url The URL to fetch
     * @returns The HTML content of the web page
     * @throws Error if the fetch fails
     */
    fetchPage(url: string): Promise<string>;
}

