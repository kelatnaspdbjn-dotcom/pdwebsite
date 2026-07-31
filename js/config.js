const CONFIG = {
    SHEET_ID: '1hvMHE__krMFi5RevklY0JibAf9GXPKPCemQUb5EpnYQ',
    API_KEY: 'AIzaSyDmQ9fNtNwK4u7X8Y9Z0A1B2C3D4E5F6G7H8I9J0',
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw__WnxW65wpxwWOmReR0DodrCFb8N5wgtQ5kr5mcAV5b0rXaNMwqEpj7o9R74f_6oNnQ/exec',
    
    SHEETS: {
        BERITA: 'berita',
        ANGGOTA: 'anggota',
        RANTING: 'ranting',
        JADWAL: 'jadwal',
        ABSENSI: 'absensi',
        UKT: 'ukt',
        SURAT_MASUK: 'surat_masuk',
        SURAT_KELUAR: 'surat_keluar',
        KEUANGAN: 'keuangan',
        CATATAN: 'catatan'
    },
    
    GITHUB: {
        REPO: 'username/perisai-diri',
        BRANCH: 'main',
        TOKEN: 'github_token_here'
    }
};

function getGoogleSheetsURL(sheetName) {
    return `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${sheetName}?key=${CONFIG.API_KEY}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getGoogleSheetsURL };
}