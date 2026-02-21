import { HttpSportsHallRemoteService } from '../../../src/adapter/service/HttpSportsHallRemoteService';
import { Club } from '../../../src/domain/model/Club';
import { WebPageService } from '../../../src/domain/service/WebPageService';

describe('HttpSportsHallRemoteService', () => {
    let service: HttpSportsHallRemoteService;
    let mockWebPageService: jest.Mocked<WebPageService>;
    const club: Club = { name: 'Test Club', url: 'http://testclub.de' } as Club;

    beforeEach(() => {
        mockWebPageService = {
            fetchPage: jest.fn(),
        };
        service = new HttpSportsHallRemoteService(mockWebPageService);
    });

    it('should_parse_street_and_house_number_correctly_when_both_are_present', async () => {
        const html = `<h2>Adressen</h2><div><span class="font-semibold">Spiellokal 1</span><div><div class="pb-4"><a>Teststraße 12<br>12345 Teststadt</a></div></div></div>`;
        mockWebPageService.fetchPage.mockResolvedValueOnce(html);

        const result = await service.fetchSportsHalls(club);

        expect(result[0].street).toBe('Teststraße');
        expect(result[0].houseNumber).toBe('12');
        expect(result[0].postalCode).toBe('12345');
        expect(result[0].city).toBe('Teststadt');
    });

    it('should_parse_street_only_correctly_when_no_house_number_is_present', async () => {
        const html = `<h2>Adressen</h2><div><span class="font-semibold">Spiellokal 1</span><div><div class="pb-4"><a>Teststraße<br>12345 Teststadt</a></div></div></div>`;
        mockWebPageService.fetchPage.mockResolvedValueOnce(html);

        const result = await service.fetchSportsHalls(club);

        expect(result[0].street).toBe('Teststraße');
        expect(result[0].houseNumber).toBe('');
        expect(result[0].postalCode).toBe('12345');
        expect(result[0].city).toBe('Teststadt');
    });

    it('should_handle_missing_adressen_section_gracefully', async () => {
        const html = `<h2>OtherSection</h2>`;
        mockWebPageService.fetchPage.mockResolvedValueOnce(html);

        const result = await service.fetchSportsHalls(club);

        expect(result).toEqual([]);
    });

    it('should_call_web_page_service_with_correct_url', async () => {
        const html = `<h2>Adressen</h2>`;
        mockWebPageService.fetchPage.mockResolvedValueOnce(html);

        await service.fetchSportsHalls(club);

        expect(mockWebPageService.fetchPage).toHaveBeenCalledWith(`${club.url}/info`);
    });

    it('should_throw_error_when_web_page_service_fails', async () => {
        const error = new Error('Network error');
        mockWebPageService.fetchPage.mockRejectedValueOnce(error);

        await expect(service.fetchSportsHalls(club)).rejects.toThrow('Network error');
    });

    it('should_parse_multiple_sports_halls_correctly', async () => {
        const html = `
            <h2>Adressen</h2>
            <div>
                <span class="font-semibold">Spiellokal 1</span>
                <div><div class="pb-4"><a>Straße A 1<br>10000 Stadt A</a></div></div>
                <span class="font-semibold">Spiellokal 2</span>
                <div><div class="pb-4"><a>Straße B 2<br>20000 Stadt B</a></div></div>
            </div>
        `;
        mockWebPageService.fetchPage.mockResolvedValueOnce(html);

        const result = await service.fetchSportsHalls(club);

        expect(result).toHaveLength(2);
        expect(result[0].sportshallNumber).toBe(1);
        expect(result[1].sportshallNumber).toBe(2);
    });
});

