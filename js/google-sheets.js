class GoogleSheetsService {
    constructor() {
        this.cache = new Map();
        this.baseURL = CONFIG.GOOGLE_SCRIPT_URL;
    }

    // ===== FETCH DATA =====
    async fetchData(sheetName) {
        if (this.cache.has(sheetName)) {
            return this.cache.get(sheetName);
        }

        try {
            const url = `${this.baseURL}?sheet=${sheetName}`;
            console.log(`📥 Fetching: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.error) {
                throw new Error(data.error);
            }
            
            this.cache.set(sheetName, data || []);
            return data || [];
            
        } catch (error) {
            console.error(`❌ Error fetching ${sheetName}:`, error);
            return [];
        }
    }

    // ===== SAVE DATA (CREATE, UPDATE, DELETE) =====
    async saveData(sheetName, data) {
        try {
            console.log(`📤 Saving to ${sheetName}:`, data);
            
            const payload = {
                sheet: sheetName,
                data: data,
                id: data.id || null,
                _delete: data._delete || false
            };
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Save result:', result);
            
            if (result && result.error) {
                throw new Error(result.error);
            }
            
            // Clear cache setelah save
            this.cache.delete(sheetName);
            return result;
            
        } catch (error) {
            console.error(`❌ Error saving to ${sheetName}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const sheetService = new GoogleSheetsService();
