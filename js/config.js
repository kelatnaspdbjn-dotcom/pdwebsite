const CONFIG = {
    // Hapus SHEET_ID dan API_KEY (tidak perlu lagi)
    // SHEET_ID: '...',
    // API_KEY: '...',
    
    // Ganti dengan URL Apps Script Anda
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxudA3ZYjaWLNor52xuG_M_xUOCeJ4pGN5g-71OATKs5isL1l1OzhGPy8gPW5IL0VcneA/exec',
    
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
    }
};

// Fungsi untuk mengambil data
function getGoogleSheetsURL(sheetName) {
    return `${CONFIG.GOOGLE_SCRIPT_URL}?sheet=${sheetName}`;
}
