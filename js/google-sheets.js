class GoogleSheetsService {
    constructor() {
        this.cache = new Map();
        this.baseURL = CONFIG.GOOGLE_SCRIPT_URL;
    }

    // Fetch data dari AppScript
    async fetchData(sheetName) {
        if (this.cache.has(sheetName)) {
            return this.cache.get(sheetName);
        }

        try {
            const url = `${this.baseURL}?sheet=${sheetName}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Jika ada error dari AppScript
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.cache.set(sheetName, data);
            return data;
            
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    // Save data ke AppScript
    async saveData(sheetName, data) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sheet: sheetName,
                    data: data,
                    id: data.id,
                    _delete: data._delete || false
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to save data');
            }
            
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.cache.delete(sheetName);
            return result;
            
        } catch (error) {
            console.error('Error saving data:', error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const sheetService = new GoogleSheetsService();
