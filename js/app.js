class PerisaiDiriApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.data = {};
        this.charts = {};
        this.quillEditor = null;
        this.currentUser = null;
        this.isPublic = true;
        this.init();
    }

    async init() {
        // Cek session login
        this.checkSession();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadAllData();
        
        // Render berdasarkan mode
        if (this.isPublic) {
            this.renderPublic();
        } else {
            this.renderDashboard();
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString('id-ID');
        }
    }

    checkSession() {
        const user = localStorage.getItem('perisaiDiriUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.isPublic = false;
            document.getElementById('publicView').style.display = 'none';
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            document.getElementById('currentUser').textContent = this.currentUser.name || 'Admin';
            document.getElementById('userRole').textContent = this.currentUser.role || 'Administrator';
        } else {
            this.isPublic = true;
            document.getElementById('publicView').style.display = 'block';
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'none';
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateTo(section);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('show');
        });

        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'dynamicForm') {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });

        // Public nav smooth scroll
        document.querySelectorAll('#publicNav .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    async loadAllData() {
        const sections = ['berita', 'anggota', 'ranting', 'jadwal', 'absensi', 'ukt', 'surat_masuk', 'surat_keluar', 'keuangan', 'catatan'];
        
        for (const section of sections) {
            try {
                this.data[section] = await sheetService.fetchData(section);
            } catch (error) {
                console.error(`Error loading ${section}:`, error);
                this.data[section] = [];
            }
        }
    }

    // ========== PUBLIC VIEW ==========
    renderPublic() {
        this.renderPublicBerita();
        this.renderPublicJadwal();
        this.renderPublicTempat();
        this.renderPublicRanting();
    }

    renderPublicBerita() {
        const container = document.getElementById('publicBeritaList');
        const data = (this.data.berita || []).filter(b => b.status === 'published');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-newspaper fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada berita terbaru</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.slice(0, 6).map(item => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="public-card">
                    ${item.foto ? `<img src="${item.foto}" class="card-img-top" alt="${item.judul}">` : 
                    `<div class="card-img-top bg-light d-flex align-items-center justify-content-center">
                        <i class="fas fa-image fa-3x text-muted" style="opacity:0.3;"></i>
                    </div>`}
                    <div class="card-body">
                        <h5 class="card-title">${item.judul || 'Tanpa Judul'}</h5>
                        <p class="text-muted small">
                            <i class="far fa-calendar-alt"></i> ${item.tanggal || ''}
                            ${item.penulis ? ` • <i class="far fa-user"></i> ${item.penulis}` : ''}
                        </p>
                        ${item.tag ? `<div>${item.tag.split(',').slice(0, 3).map(t => `<span class="berita-tag">#${t.trim()}</span>`).join('')}</div>` : ''}
                        <p class="card-text mt-2">${(item.konten || '').replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPublicJadwal() {
        const container = document.getElementById('publicJadwalList');
        const data = this.data.jadwal || [];
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-calendar fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada jadwal latihan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="col-md-4 mb-4">
                <div class="public-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title">
                                <i class="fas fa-calendar-day text-primary"></i> ${item.hari || ''}
                            </h5>
                            <span class="badge bg-primary">${item.waktu || ''}</span>
                        </div>
                        <p class="mt-3">
                            <i class="fas fa-map-marker-alt text-danger"></i> ${item.tempat || 'Tempat belum ditentukan'}
                        </p>
                        ${item.alamat ? `<p class="text-muted small"><i class="fas fa-location-dot"></i> ${item.alamat}</p>` : ''}
                        ${item.cabang ? `<p class="text-muted small"><i class="fas fa-sitemap"></i> Cabang: ${item.cabang}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPublicTempat() {
        const container = document.getElementById('publicTempatList');
        const data = this.data.jadwal || [];
        const tempatMap = {};
        
        data.forEach(item => {
            if (item.tempat) {
                const key = item.tempat + '|' + (item.alamat || '');
                if (!tempatMap[key]) {
                    tempatMap[key] = {
                        nama: item.tempat,
                        alamat: item.alamat || '',
                        cabang: item.cabang || '',
                        jadwal: []
                    };
                }
                tempatMap[key].jadwal.push(item.hari + ' ' + item.waktu);
            }
        });

        const tempatList = Object.values(tempatMap);
        
        if (tempatList.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-map-marker-alt fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada tempat latihan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tempatList.map(item => `
            <div class="col-md-4 mb-4">
                <div class="public-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-map-pin text-danger"></i> ${item.nama}
                        </h5>
                        <p class="text-muted small">
                            <i class="fas fa-location-dot"></i> ${item.alamat || 'Alamat belum tersedia'}
                        </p>
                        ${item.cabang ? `<p class="text-muted small"><i class="fas fa-sitemap"></i> Cabang: ${item.cabang}</p>` : ''}
                        <div class="mt-2">
                            <small class="text-muted">Jadwal:</small>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${item.jadwal.map(j => `<span class="badge bg-secondary">${j}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPublicRanting() {
        const container = document.getElementById('publicRantingList');
        const data = this.data.ranting || [];
        const anggota = this.data.anggota || [];
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-sitemap fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada data ranting</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(item => {
            const anggotaRanting = anggota.filter(a => a.ranting === item.nama);
            return `
                <div class="col-md-4 mb-4">
                    <div class="ranting-card">
                        <div class="ranting-header">
                            <h5><i class="fas fa-flag text-primary"></i> ${item.nama}</h5>
                            <span class="badge bg-primary">${anggotaRanting.length} Anggota</span>
                        </div>
                        <p class="text-muted small">
                            <i class="fas fa-map-marker-alt"></i> ${item.alamat || 'Alamat belum tersedia'}
                        </p>
                        ${item.cabang ? `<p class="text-muted small"><i class="fas fa-sitemap"></i> Cabang: ${item.cabang}</p>` : ''}
                        <div class="ranting-cabang">
                            <small class="text-muted">Pengurus:</small>
                            <div class="mt-1">
                                ${item.ketua ? `<span class="badge bg-info">Ketua: ${item.ketua}</span>` : ''}
                                ${item.sekretaris ? `<span class="badge bg-secondary">Sekretaris: ${item.sekretaris}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========== PRIVATE VIEW ==========
    navigateTo(section) {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.sidebar .nav-link[data-section="${section}"]`);
        if (activeLink) activeLink.classList.add('active');

        document.querySelectorAll('.section-content').forEach(el => {
            el.classList.remove('active');
        });
        const targetSection = document.getElementById(section);
        if (targetSection) targetSection.classList.add('active');

        this.currentSection = section;
        this.renderSection(section);

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('show');
        }
    }

    renderSection(section) {
        switch(section) {
            case 'dashboard': this.renderDashboard(); break;
            case 'berita': this.renderBerita(); break;
            case 'anggota': this.renderAnggota(); break;
            case 'ranting': this.renderRanting(); break;
            case 'jadwal': this.renderJadwal(); break;
            case 'absensi': this.renderAbsensi(); break;
            case 'ukt': this.renderUKT(); break;
            case 'surat': this.renderSurat(); break;
            case 'keuangan': this.renderKeuangan(); break;
            case 'catatan': this.renderCatatan(); break;
        }
    }

    renderDashboard() {
        const anggota = this.data.anggota || [];
        const berita = (this.data.berita || []).filter(b => b.status === 'published');
        const ukt = this.data.ukt || [];
        const absensi = this.data.absensi || [];
        const ranting = this.data.ranting || [];

        document.getElementById('totalAnggota').textContent = anggota.length;
        document.getElementById('totalBerita').textContent = berita.length;
        document.getElementById('totalUKT').textContent = `Rp ${this.formatNumber(ukt.reduce((sum, item) => sum + parseFloat(item.nominal || 0), 0))}`;
        document.getElementById('totalHadir').textContent = absensi.filter(a => a.status === 'Hadir').length;

        this.renderKehadiranRantingChart(absensi, ranting);
        this.renderKeuanganChart(ukt);
    }

    renderKehadiranRantingChart(absensi, ranting) {
        const ctx = document.getElementById('chartKehadiranRanting')?.getContext('2d');
        if (!ctx) return;

        const rantingData = {};
        ranting.forEach(r => {
            rantingData[r.nama] = { hadir: 0, tidak: 0 };
        });

        absensi.forEach(a => {
            const anggota = this.data.anggota?.find(ang => ang.id == a.anggota_id);
            const rantingNama = anggota?.ranting || 'Tanpa Ranting';
            if (!rantingData[rantingNama]) {
                rantingData[rantingNama] = { hadir: 0, tidak: 0 };
            }
            if (a.status === 'Hadir') {
                rantingData[rantingNama].hadir++;
            } else {
                rantingData[rantingNama].tidak++;
            }
        });

        const labels = Object.keys(rantingData);
        const hadirData = labels.map(l => rantingData[l].hadir);
        const tidakData = labels.map(l => rantingData[l].tidak);

        if (this.charts.kehadiranRanting) {
            this.charts.kehadiranRanting.destroy();
        }

        this.charts.kehadiranRanting = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Hadir',
                        data: hadirData,
                        backgroundColor: '#27ae60',
                        borderRadius: 4
                    },
                    {
                        label: 'Tidak Hadir',
                        data: tidakData,
                        backgroundColor: '#e74c3c',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

    renderKeuanganChart(data) {
        const ctx = document.getElementById('chartKeuangan')?.getContext('2d');
        if (!ctx) return;

        const categories = {};
        data.forEach(item => {
            const cat = item.kategori || 'Lainnya';
            categories[cat] = (categories[cat] || 0) + parseFloat(item.nominal || 0);
        });

        if (this.charts.keuangan) {
            this.charts.keuangan.destroy();
        }

        this.charts.keuangan = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });
    }

    // ========== RENDER RANTING ==========
    renderRanting() {
        const container = document.getElementById('rantingContent');
        const data = this.data.ranting || [];
        const anggota = this.data.anggota || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-sitemap fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada data ranting</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(item => {
            const anggotaRanting = anggota.filter(a => a.ranting === item.nama);
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="ranting-card">
                        <div class="ranting-header">
                            <h5><i class="fas fa-flag text-primary"></i> ${item.nama}</h5>
                            <div>
                                <span class="badge bg-primary">${anggotaRanting.length} Anggota</span>
                            </div>
                        </div>
                        <p class="text-muted small">
                            <i class="fas fa-map-marker-alt"></i> ${item.alamat || 'Alamat belum tersedia'}
                        </p>
                        ${item.cabang ? `<p><i class="fas fa-sitemap"></i> Cabang: <strong>${item.cabang}</strong></p>` : ''}
                        <div class="ranting-cabang">
                            <small class="text-muted">Pengurus:</small>
                            <div class="mt-1">
                                ${item.ketua ? `<span class="badge bg-info me-1">Ketua: ${item.ketua}</span>` : ''}
                                ${item.sekretaris ? `<span class="badge bg-secondary me-1">Sekretaris: ${item.sekretaris}</span>` : ''}
                                ${item.bendahara ? `<span class="badge bg-warning">Bendahara: ${item.bendahara}</span>` : ''}
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-info" onclick="app.editData('ranting', '${item.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteData('ranting', '${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========== RENDER ABSENSI ==========
    renderAbsensi() {
        const container = document.getElementById('absensiContent');
        let data = this.data.absensi || [];
        const anggota = this.data.anggota || [];
        const ranting = this.data.ranting || [];

        // Filter
        const filterRanting = document.getElementById('filterRanting')?.value || 'all';
        const filterTanggal = document.getElementById('filterTanggal')?.value || '';
        const filterStatus = document.getElementById('filterStatusAbsensi')?.value || 'all';

        // Populate filter ranting
        const rantingSelect = document.getElementById('filterRanting');
        if (rantingSelect) {
            const currentValue = rantingSelect.value;
            rantingSelect.innerHTML = '<option value="all">Semua Ranting</option>' + 
                ranting.map(r => `<option value="${r.nama}">${r.nama}</option>`).join('');
            rantingSelect.value = currentValue;
        }

        // Apply filters
        data = data.filter(item => {
            const anggotaData = anggota.find(a => a.id == item.anggota_id);
            const rantingNama = anggotaData?.ranting || 'Tanpa Ranting';
            
            if (filterRanting !== 'all' && rantingNama !== filterRanting) return false;
            if (filterTanggal && item.tanggal !== filterTanggal) return false;
            if (filterStatus !== 'all' && item.status !== filterStatus) return false;
            return true;
        });

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-clipboard-check fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada data absensi</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map((item, index) => {
            const anggotaData = anggota.find(a => a.id == item.anggota_id);
            return `
                <div class="absensi-card">
                    <div class="absensi-header">
                        <div class="d-flex align-items-center gap-3">
                            <img src="${anggotaData?.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(anggotaData?.nama || '') + '&background=c0392b&color=fff&size=80'}" 
                                 class="absensi-foto" alt="${anggotaData?.nama}">
                            <div>
                                <h6 class="mb-0">${anggotaData?.nama || 'Tidak Diketahui'}</h6>
                                <small class="text-muted">
                                    ${anggotaData?.ranting || '-'} • ${anggotaData?.cabang || '-'}
                                </small>
                                <div>
                                    <span class="badge ${item.status === 'Hadir' ? 'bg-success' : item.status === 'Izin' ? 'bg-warning' : item.status === 'Sakit' ? 'bg-info' : 'bg-danger'}">
                                        ${item.status || 'Tidak Hadir'}
                                    </span>
                                    <span class="badge bg-secondary">${item.tanggal || ''}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-info" onclick="app.editData('absensi', '${item.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="app.deleteData('absensi', '${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${item.foto_bukti ? `
                        <div class="mt-2">
                            <img src="${item.foto_bukti}" class="img-fluid rounded" style="max-width:200px; max-height:150px;" alt="Bukti Absensi">
                        </div>
                    ` : ''}
                    ${item.catatan ? `
                        <div class="absensi-catatan">
                            <small class="text-muted"><i class="fas fa-pencil-alt"></i> Catatan: ${item.catatan}</small>
                        </div>
                    ` : ''}
                    ${item.materi ? `
                        <div class="absensi-catatan mt-2">
                            <small class="text-muted"><i class="fas fa-book"></i> Materi: ${item.materi}</small>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    filterAbsensi() {
        this.renderAbsensi();
    }

    // ========== RENDER CATATAN ==========
    renderCatatan() {
        const container = document.getElementById('catatanContent');
        const data = this.data.catatan || [];
        const anggota = this.data.anggota || [];

        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-book fa-3x mb-3" style="opacity:0.3;"></i>
                    <p>Belum ada catatan latihan</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map((item, index) => {
            const pelatih = anggota.find(a => a.id == item.pelatih_id);
            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title">
                                    <i class="fas fa-calendar-day text-primary"></i> ${item.tanggal || ''}
                                </h5>
                                <p class="text-muted small">
                                    <i class="fas fa-user"></i> Pelatih: ${pelatih?.nama || item.pelatih_nama || 'Tidak Diketahui'}
                                    ${item.ranting ? ` • <i class="fas fa-flag"></i> Ranting: ${item.ranting}` : ''}
                                </p>
                            </div>
                            <div>
                                <button class="btn btn-sm btn-info" onclick="app.editData('catatan', '${item.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteData('catatan', '${item.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <h6><i class="fas fa-book-open"></i> Materi:</h6>
                            <p>${item.materi || '-'}</p>
                        </div>
                        ${item.catatan ? `
                            <div class="absensi-catatan">
                                <h6><i class="fas fa-pencil-alt"></i> Catatan:</h6>
                                <p>${item.catatan}</p>
                            </div>
                        ` : ''}
                        ${item.jumlah_peserta ? `
                            <div class="mt-2">
                                <span class="badge bg-primary">Jumlah Peserta: ${item.jumlah_peserta}</span>
                                ${item.jumlah_hadir ? `<span class="badge bg-success">Hadir: ${item.jumlah_hadir}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========== FORM GENERATION ==========
    showForm(section) {
        if (!this.currentUser) {
            Swal.fire('Silakan login terlebih dahulu', '', 'warning');
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const title = document.getElementById('formModalTitle');
        const body = document.getElementById('formModalBody');
        
        title.textContent = `Tambah ${this.capitalize(section)}`;
        body.innerHTML = this.generateForm(section);
        
        if (section === 'berita') {
            setTimeout(() => {
                this.quillEditor = new Quill('#editorContainer', {
                    theme: 'snow',
                    placeholder: 'Tulis konten berita...',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline', 'strike'],
                            ['blockquote', 'code-block'],
                            [{ 'header': 1 }, { 'header': 2 }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'script': 'sub'}, { 'script': 'super' }],
                            [{ 'indent': '-1'}, { 'indent': '+1' }],
                            [{ 'direction': 'rtl' }],
                            [{ 'size': ['small', false, 'large', 'huge'] }],
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'font': [] }],
                            [{ 'align': [] }],
                            ['clean'],
                            ['link', 'image', 'video']
                        ]
                    }
                });
            }, 100);
        }
        
        modal.show();
    }

    generateForm(section) {
        const anggotaOptions = this.getAnggotaOptions();
        const rantingOptions = this.getRantingOptions();
        
        const forms = {
            berita: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Judul Berita *</label>
                    <input type="text" class="form-control" name="judul" required>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Tanggal *</label>
                        <input type="date" class="form-control" name="tanggal" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Status *</label>
                        <select class="form-select" name="status" required>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Penulis</label>
                    <select class="form-select" name="penulis">
                        <option value="">Pilih Penulis</option>
                        ${anggotaOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tag (pisahkan dengan koma)</label>
                    <input type="text" class="form-control" name="tag" placeholder="Contoh: kejuaraan, prestasi, latihan">
                </div>
                <div class="mb-3">
                    <label class="form-label">Foto Berita</label>
                    <div class="image-upload" onclick="document.getElementById('imageInput').click()">
                        <i class="fas fa-cloud-upload-alt fa-2x mb-2" style="color:#c0392b;"></i>
                        <p class="mb-0">Klik untuk upload foto</p>
                        <small class="text-muted">Format: JPG, PNG, WebP (Max 2MB)</small>
                    </div>
                    <input type="file" id="imageInput" class="d-none" accept="image/*" onchange="app.handleImageUpload(event)">
                    <div id="imagePreview" class="image-preview mt-3" style="display:none;">
                        <img id="previewImage" src="" alt="Preview" style="max-width:100%; max-height:200px; border-radius:8px;">
                        <button type="button" class="remove-image" onclick="app.removeImage()">×</button>
                    </div>
                    <input type="hidden" name="foto" id="fotoInput">
                </div>
                <div class="mb-3">
                    <label class="form-label">Konten *</label>
                    <div id="editorContainer" style="min-height:200px;"></div>
                    <input type="hidden" name="konten" id="kontenInput">
                </div>
            `,
            anggota: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Nama Lengkap *</label>
                        <input type="text" class="form-control" name="nama" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-control" name="email" required>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Telepon *</label>
                        <input type="tel" class="form-control" name="telepon" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Tempat, Tanggal Lahir</label>
                        <input type="text" class="form-control" name="tempat_tanggal_lahir" placeholder="Contoh: Jakarta, 1 Januari 2000">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Ranting *</label>
                        <select class="form-select" name="ranting" required>
                            <option value="">Pilih Ranting</option>
                            ${rantingOptions}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Cabang</label>
                        <select class="form-select" name="cabang">
                            <option value="">Pilih Cabang</option>
                            ${this.getCabangOptions()}
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tingkatan</label>
                    <select class="form-select" name="tingkatan">
                        <option value="">Pilih Tingkatan</option>
                        <option value="Pemula">Pemula</option>
                        <option value="Dasar">Dasar</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Lanjutan">Lanjutan</option>
                        <option value="Pelatih">Pelatih</option>
                        <option value="Guru">Guru</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Foto Anggota</label>
                    <div class="image-upload" onclick="document.getElementById('imageInputAnggota').click()">
                        <i class="fas fa-user-circle fa-2x mb-2" style="color:#c0392b;"></i>
                        <p class="mb-0">Klik untuk upload foto</p>
                    </div>
                    <input type="file" id="imageInputAnggota" class="d-none" accept="image/*" onchange="app.handleImageUpload(event, 'anggota')">
                    <div id="imagePreviewAnggota" class="image-preview mt-3" style="display:none;">
                        <img id="previewImageAnggota" src="" alt="Preview" style="max-width:100%; max-height:200px; border-radius:8px;">
                        <button type="button" class="remove-image" onclick="app.removeImage('anggota')">×</button>
                    </div>
                    <input type="hidden" name="foto" id="fotoInputAnggota">
                </div>
                <div class="mb-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" name="status">
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                </div>
            `,
            ranting: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Nama Ranting *</label>
                    <input type="text" class="form-control" name="nama" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Cabang</label>
                    <input type="text" class="form-control" name="cabang" placeholder="Nama cabang">
                </div>
                <div class="mb-3">
                    <label class="form-label">Alamat</label>
                    <textarea class="form-control" name="alamat" rows="2"></textarea>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Ketua</label>
                        <input type="text" class="form-control" name="ketua" placeholder="Nama ketua">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Sekretaris</label>
                        <input type="text" class="form-control" name="sekretaris" placeholder="Nama sekretaris">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Bendahara</label>
                        <input type="text" class="form-control" name="bendahara" placeholder="Nama bendahara">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" name="keterangan" rows="2"></textarea>
                </div>
            `,
            jadwal: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Hari *</label>
                        <select class="form-select" name="hari" required>
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                            <option value="Sabtu">Sabtu</option>
                            <option value="Minggu">Minggu</option>
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Waktu *</label>
                        <input type="text" class="form-control" name="waktu" placeholder="Contoh: 16:00 - 18:00" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tempat Latihan *</label>
                    <input type="text" class="form-control" name="tempat" placeholder="Nama tempat" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Alamat Tempat</label>
                    <textarea class="form-control" name="alamat" rows="2" placeholder="Alamat lengkap tempat latihan"></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Cabang</label>
                        <select class="form-select" name="cabang">
                            <option value="">Pilih Cabang</option>
                            ${this.getCabangOptions()}
                        </select>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Kapasitas</label>
                        <input type="number" class="form-control" name="kapasitas" placeholder="Jumlah peserta maksimal">
                    </div>
                </div>
            `,
            absensi: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Anggota *</label>
                    <select class="form-select" name="anggota_id" required>
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Tanggal *</label>
                        <input type="date" class="form-control" name="tanggal" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Status *</label>
                        <select class="form-select" name="status" required>
                            <option value="Hadir">Hadir</option>
                            <option value="Tidak Hadir">Tidak Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Foto Bukti Absensi</label>
                    <div class="image-upload" onclick="document.getElementById('imageInputAbsensi').click()">
                        <i class="fas fa-camera fa-2x mb-2" style="color:#c0392b;"></i>
                        <p class="mb-0">Upload foto bukti absensi</p>
                    </div>
                    <input type="file" id="imageInputAbsensi" class="d-none" accept="image/*" onchange="app.handleImageUpload(event, 'absensi')">
                    <div id="imagePreviewAbsensi" class="image-preview mt-3" style="display:none;">
                        <img id="previewImageAbsensi" src="" alt="Preview" style="max-width:100%; max-height:200px; border-radius:8px;">
                        <button type="button" class="remove-image" onclick="app.removeImage('absensi')">×</button>
                    </div>
                    <input type="hidden" name="foto_bukti" id="fotoInputAbsensi">
                </div>
                <div class="mb-3">
                    <label class="form-label">Catatan</label>
                    <textarea class="form-control" name="catatan" rows="2" placeholder="Catatan tambahan tentang absensi"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Materi Latihan</label>
                    <input type="text" class="form-control" name="materi" placeholder="Materi yang dilatih">
                </div>
            `,
            ukt: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Anggota *</label>
                    <select class="form-select" name="anggota_id" required>
                        <option value="">Pilih Anggota</option>
                        ${anggotaOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Nominal *</label>
                    <div class="input-group">
                        <span class="input-group-text">Rp</span>
                        <input type="number" class="form-control" name="nominal" required min="0">
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tanggal Bayar</label>
                    <input type="date" class="form-control" name="tanggal_bayar">
                </div>
                <div class="mb-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" name="status">
                        <option value="Lunas">Lunas</option>
                        <option value="Belum Lunas">Belum Lunas</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" name="keterangan" rows="2"></textarea>
                </div>
            `,
            surat_masuk: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Nomor Surat *</label>
                    <input type="text" class="form-control" name="nomor" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tanggal *</label>
                    <input type="date" class="form-control" name="tanggal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Perihal *</label>
                    <input type="text" class="form-control" name="perihal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Asal *</label>
                    <input type="text" class="form-control" name="asal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" name="keterangan" rows="2"></textarea>
                </div>
            `,
            surat_keluar: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Nomor Surat *</label>
                    <input type="text" class="form-control" name="nomor" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tanggal *</label>
                    <input type="date" class="form-control" name="tanggal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Perihal *</label>
                    <input type="text" class="form-control" name="perihal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Tujuan *</label>
                    <input type="text" class="form-control" name="tujuan" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan</label>
                    <textarea class="form-control" name="keterangan" rows="2"></textarea>
                </div>
            `,
            keuangan: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Tanggal *</label>
                    <input type="date" class="form-control" name="tanggal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Keterangan *</label>
                    <input type="text" class="form-control" name="keterangan" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Kategori</label>
                    <select class="form-select" name="kategori">
                        <option value="Pemasukan">Pemasukan</option>
                        <option value="Pengeluaran">Pengeluaran</option>
                        <option value="Donasi">Donasi</option>
                        <option value="Lainnya">Lainnya</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Nominal *</label>
                    <div class="input-group">
                        <span class="input-group-text">Rp</span>
                        <input type="number" class="form-control" name="nominal" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Catatan</label>
                    <textarea class="form-control" name="catatan" rows="2"></textarea>
                </div>
            `,
            catatan: `
                <input type="hidden" name="id" value="${Date.now()}">
                <div class="mb-3">
                    <label class="form-label">Tanggal *</label>
                    <input type="date" class="form-control" name="tanggal" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Ranting *</label>
                    <select class="form-select" name="ranting" required>
                        <option value="">Pilih Ranting</option>
                        ${rantingOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Pelatih</label>
                    <select class="form-select" name="pelatih_id">
                        <option value="">Pilih Pelatih</option>
                        ${anggotaOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Materi Latihan *</label>
                    <textarea class="form-control" name="materi" rows="3" required placeholder="Materi yang diajarkan"></textarea>
                </div>
                <div class="mb-3">
                    <label class="form-label">Catatan Tambahan</label>
                    <textarea class="form-control" name="catatan" rows="2" placeholder="Catatan penting tentang latihan"></textarea>
                </div>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Jumlah Peserta</label>
                        <input type="number" class="form-control" name="jumlah_peserta" placeholder="Total peserta">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Jumlah Hadir</label>
                        <input type="number" class="form-control" name="jumlah_hadir" placeholder="Peserta yang hadir">
                    </div>
                </div>
            `
        };

        return `
            <form id="dynamicForm" data-section="${section}">
                ${forms[section] || '<p class="text-muted">Form untuk section ini belum tersedia</p>'}
                <button type="submit" class="btn btn-primary w-100 mt-3">
                    <i class="fas fa-save"></i> Simpan
                </button>
            </form>
        `;
    }

    // ========== HELPER METHODS ==========
    getRantingOptions() {
        const ranting = this.data.ranting || [];
        return ranting.map(r => 
            `<option value="${r.nama}">${r.nama}${r.cabang ? ' - ' + r.cabang : ''}</option>`
        ).join('');
    }

    getCabangOptions() {
        const ranting = this.data.ranting || [];
        const cabangSet = new Set();
        ranting.forEach(r => {
            if (r.cabang) cabangSet.add(r.cabang);
        });
        return Array.from(cabangSet).map(c => 
            `<option value="${c}">${c}</option>`
        ).join('');
    }

    getAnggotaOptions() {
        const anggota = this.data.anggota || [];
        return anggota.filter(a => a.status === 'Aktif').map(a => 
            `<option value="${a.id}">${a.nama}${a.ranting ? ' - ' + a.ranting : ''}${a.tingkatan ? ' (' + a.tingkatan + ')' : ''}</option>`
        ).join('');
    }

    handleImageUpload(event, type = 'berita') {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            Swal.fire('Error', 'Ukuran file maksimal 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const typeMap = {
                berita: { preview: 'imagePreview', img: 'previewImage', input: 'fotoInput' },
                anggota: { preview: 'imagePreviewAnggota', img: 'previewImageAnggota', input: 'fotoInputAnggota' },
                absensi: { preview: 'imagePreviewAbsensi', img: 'previewImageAbsensi', input: 'fotoInputAbsensi' }
            };
            
            const config = typeMap[type] || typeMap.berita;
            document.getElementById(config.preview).style.display = 'block';
            document.getElementById(config.img).src = e.target.result;
            document.getElementById(config.input).value = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeImage(type = 'berita') {
        const typeMap = {
            berita: { preview: 'imagePreview', img: 'previewImage', input: 'fotoInput', file: 'imageInput' },
            anggota: { preview: 'imagePreviewAnggota', img: 'previewImageAnggota', input: 'fotoInputAnggota', file: 'imageInputAnggota' },
            absensi: { preview: 'imagePreviewAbsensi', img: 'previewImageAbsensi', input: 'fotoInputAbsensi', file: 'imageInputAbsensi' }
        };
        
        const config = typeMap[type] || typeMap.berita;
        document.getElementById(config.preview).style.display = 'none';
        document.getElementById(config.img).src = '';
        document.getElementById(config.input).value = '';
        document.getElementById(config.file).value = '';
    }

    async handleFormSubmit(form) {
        const section = form.dataset.section;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        if (section === 'berita' && this.quillEditor) {
            data.konten = this.quillEditor.root.innerHTML;
        }
        
        try {
            await sheetService.saveData(section, data);
            await this.loadAllData();
            
            if (this.isPublic) {
                this.renderPublic();
            } else {
                this.renderSection(this.currentSection);
            }
            
            bootstrap.Modal.getInstance(document.getElementById('formModal'))?.hide();
            
            if (this.quillEditor) {
                this.quillEditor = null;
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: 'Terjadi kesalahan saat menyimpan data',
                confirmButtonColor: '#c0392b'
            });
        }
    }

    async editData(section, id) {
        const data = this.data[section] || [];
        const item = data.find(d => d.id == id);
        
        if (!item) {
            Swal.fire('Error', 'Data tidak ditemukan', 'error');
            return;
        }

        this.showForm(section);
        
        setTimeout(() => {
            const form = document.getElementById('dynamicForm');
            if (!form) return;
            
            Object.keys(item).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = item[key] || '';
                }
            });
            
            if (section === 'berita' && this.quillEditor && item.konten) {
                this.quillEditor.root.innerHTML = item.konten;
            }
            
            const fotoFields = ['foto', 'foto_bukti'];
            fotoFields.forEach(field => {
                if (item[field]) {
                    const typeMap = {
                        foto: { preview: 'imagePreview', img: 'previewImage', input: 'fotoInput' },
                        foto_bukti: { preview: 'imagePreviewAbsensi', img: 'previewImageAbsensi', input: 'fotoInputAbsensi' }
                    };
                    const config = typeMap[field];
                    if (config) {
                        document.getElementById(config.preview).style.display = 'block';
                        document.getElementById(config.img).src = item[field];
                        document.getElementById(config.input).value = item[field];
                    }
                }
            });
        }, 200);
    }

    async deleteData(section, id) {
        const result = await Swal.fire({
            title: 'Hapus Data?',
            text: 'Data akan dihapus permanen',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Hapus!'
        });

        if (result.isConfirmed) {
            try {
                await sheetService.saveData(section, { id, _delete: true });
                await this.loadAllData();
                
                if (this.isPublic) {
                    this.renderPublic();
                } else {
                    this.renderSection(this.currentSection);
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                Swal.fire('Error', 'Gagal menghapus data', 'error');
            }
        }
    }

    formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ========== GLOBAL FUNCTIONS ==========
function showLogin() {
    document.getElementById('publicView').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showPublic() {
    document.getElementById('publicView').style.display = 'block';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
    if (window.app) {
        window.app.renderPublic();
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Username: admin, Password: admin123
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('perisaiDiriUser', JSON.stringify({
            name: 'Administrator',
            username: 'admin',
            role: 'Administrator'
        }));
        
        document.getElementById('publicView').style.display = 'none';
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        if (!window.app) {
            window.app = new PerisaiDiriApp();
        } else {
            window.app.currentUser = { name: 'Administrator', role: 'Administrator' };
            window.app.isPublic = false;
            window.app.loadAllData();
            window.app.renderDashboard();
            document.getElementById('currentUser').textContent = 'Administrator';
            document.getElementById('userRole').textContent = 'Administrator';
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Selamat datang!',
            showConfirmButton: false,
            timer: 1500,
            toast: true,
            position: 'top-end'
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Login Gagal',
            text: 'Username atau password salah',
            confirmButtonColor: '#c0392b'
        });
    }
}

function logout() {
    Swal.fire({
        title: 'Keluar?',
        text: 'Anda akan keluar dari sistem',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#c0392b',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Keluar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('perisaiDiriUser');
            document.getElementById('mainApp').style.display = 'none';
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('publicView').style.display = 'block';
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            if (window.app) {
                window.app.isPublic = true;
                window.app.renderPublic();
            }
        }
    });
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PerisaiDiriApp();
});

// Expose methods globally
window.showForm = (section) => window.app?.showForm(section);
window.showLogin = showLogin;
window.showPublic = showPublic;
window.handleLogin = handleLogin;
window.logout = logout;