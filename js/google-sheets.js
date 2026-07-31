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

    // ===== SAVE DATA (CREATE, UPDATE, DELETE) - PAKAI GET =====
    async saveData(sheetName, data) {
        try {
            console.log(`📤 Saving to ${sheetName}:`, data);
            
            // Bangun URL dengan parameter
            let url = `${this.baseURL}?action=save`;
            url += `&sheet=${encodeURIComponent(sheetName)}`;
            url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            
            if (data.id) {
                url += `&id=${encodeURIComponent(data.id)}`;
            }
            if (data._delete) {
                url += `&_delete=true`;
            }
            
            console.log('📤 Sending GET request:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
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
