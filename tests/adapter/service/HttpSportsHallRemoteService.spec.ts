import { HttpSportsHallRemoteService } from '../../../src/adapter/service/HttpSportsHallRemoteService';
import { Club } from '../../../src/domain/model/Club';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpSportsHallRemoteService', () => {
    const service = new HttpSportsHallRemoteService();
    const club: Club = { name: 'Test Club', url: 'http://testclub.de' } as Club;

    it('should parse street and house number correctly when both are present', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: `<h2>Adressen</h2><div><span class="font-semibold">Spiellokal 1</span><div><div class="pb-4"><a>Teststraße 12<br>12345 Teststadt</a></div></div></div>`
        });
        const result = await service.fetchSportsHalls(club);
        expect(result[0].street).toBe('Teststraße');
        expect(result[0].houseNumber).toBe('12');
        expect(result[0].postalCode).toBe('12345');
        expect(result[0].city).toBe('Teststadt');
    });

    it('should parse street only correctly when no house number is present', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: `<h2>Adressen</h2><div><span class="font-semibold">Spiellokal 1</span><div><div class="pb-4"><a>Teststraße<br>12345 Teststadt</a></div></div></div>`
        });
        const result = await service.fetchSportsHalls(club);
        expect(result[0].street).toBe('Teststraße');
        expect(result[0].houseNumber).toBe('');
        expect(result[0].postalCode).toBe('12345');
        expect(result[0].city).toBe('Teststadt');
    });

    it('should handle missing Adressen section gracefully', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: `<h2>OtherSection</h2>`
        });
        const result = await service.fetchSportsHalls(club);
        expect(result).toEqual([]);
    });
});

