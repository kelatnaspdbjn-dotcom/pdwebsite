class GoogleSheetsService {
    constructor() {
        this.cache = new Map();
        this.isLoading = false;
    }

    async fetchData(sheetName) {
        if (this.cache.has(sheetName)) {
            return this.cache.get(sheetName);
        }

        try {
            this.isLoading = true;
            const url = getGoogleSheetsURL(sheetName);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const rows = data.values || [];
            
            if (rows.length < 2) return [];
            
            const headers = rows[0];
            const result = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    const key = header.toLowerCase().replace(/\s/g, '_');
                    obj[key] = row[index] || '';
                });
                return obj;
            });
            
            this.cache.set(sheetName, result);
            return result;
        } catch (error) {
            console.error('Error fetching data:', error);
            return this.getLocalData(sheetName);
        } finally {
            this.isLoading = false;
        }
    }

    async saveData(sheetName, data) {
        try {
            const scriptURL = CONFIG.GOOGLE_SCRIPT_URL || 'YOUR_GOOGLE_APPS_SCRIPT_URL';
            const payload = {
                sheet: sheetName,
                data: data
            };
            
            const response = await fetch(scriptURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save data');
            }
            
            this.cache.delete(sheetName);
            return await response.json();
        } catch (error) {
            console.error('Error saving data:', error);
            this.saveToLocal(sheetName, data);
            throw error;
        }
    }

    saveToLocal(sheetName, data) {
        const localData = JSON.parse(localStorage.getItem('perisaiDiriData') || '{}');
        if (!localData[sheetName]) localData[sheetName] = [];
        localData[sheetName].push(data);
        localStorage.setItem('perisaiDiriData', JSON.stringify(localData));
    }

    getLocalData(sheetName) {
        const localData = JSON.parse(localStorage.getItem('perisaiDiriData') || '{}');
        if (localData[sheetName]) {
            this.cache.set(sheetName, localData[sheetName]);
            return localData[sheetName];
        }
        return this.getDefaultData(sheetName);
    }

    getDefaultData(sheetName) {
        const defaultData = {
            ranting: [
                { id: '1', nama: 'Ranting A', cabang: 'Cabang 1', alamat: 'Jl. Contoh No. 1', ketua: 'Budi', sekretaris: 'Ani', bendahara: 'Cici' },
                { id: '2', nama: 'Ranting B', cabang: 'Cabang 1', alamat: 'Jl. Contoh No. 2', ketua: 'Dedi', sekretaris: 'Eka', bendahara: 'Fifi' }
            ],
            catatan: [
                { id: '1', tanggal: '2026-07-31', ranting: 'Ranting A', pelatih_id: '1', materi: 'Jurus Dasar', catatan: 'Latihan berjalan lancar', jumlah_peserta: '20', jumlah_hadir: '18' }
            ],
            absensi: [
                { id: '1', anggota_id: '1', tanggal: '2026-07-31', status: 'Hadir', catatan: 'Semangat', materi: 'Jurus Dasar' }
            ]
        };
        return defaultData[sheetName] || [];
    }

    clearCache() {
        this.cache.clear();
    }
}

const sheetService = new GoogleSheetsService();