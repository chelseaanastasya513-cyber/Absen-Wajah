const startCameraButton = document.getElementById('startCamera');
const capturePhotoButton = document.getElementById('capturePhoto');
const submitAttendanceButton = document.getElementById('submitAttendance');
const cameraPreview = document.getElementById('cameraPreview');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewWrapper = document.getElementById('photoPreviewWrapper');
const notification = document.getElementById('notification');
const studentNameInput = document.getElementById('studentName');
const studentNpmInput = document.getElementById('studentNpm');
const studentClassInput = document.getElementById('studentClass');
const studentMajorInput = document.getElementById('studentMajor');
const attendanceStatusSelect = document.getElementById('attendanceStatus');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const refreshButton = document.getElementById('refreshButton');
const attendanceTableBody = document.getElementById('attendanceTableBody');
const confirmationOverlay = document.getElementById('confirmationOverlay');
const confirmYesButton = document.querySelector('.confirm-yes');
const confirmNoButton = document.querySelector('.confirm-no');
const statTotal = document.getElementById('statTotal');
const statHadir = document.getElementById('statHadir');
const statSakit = document.getElementById('statSakit');
const statIzin = document.getElementById('statIzin');
const statAlfa = document.getElementById('statAlfa');
const statTerlambat = document.getElementById('statTerlambat');

let stream = null;
let capturedImageBase64 = '';
let pendingDeleteId = null;
const STORAGE_KEY = 'attendanceRecords';

const sampleRecords = [
  {
    id: 'a1',
    nama: 'Rina Aulia',
    npm: '2101021001',
    kelas: 'TI-1',
    jurusan: 'Teknik Informatika',
    status: 'Hadir',
    jam: '07:45:12',
    tanggal: '08 Juni 2026',
    dateValue: '2026-06-08',
    foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'b2',
    nama: 'Idham Pratama',
    npm: '2101021002',
    kelas: 'TI-1',
    jurusan: 'Teknik Informatika',
    status: 'Terlambat',
    jam: '07:48:05',
    tanggal: '08 Juni 2026',
    dateValue: '2026-06-08',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'c3',
    nama: 'Sarah Wijaya',
    npm: '2101021003',
    kelas: 'TI-2',
    jurusan: 'Teknik Informatika',
    status: 'Sakit',
    jam: '07:50:30',
    tanggal: '08 Juni 2026',
    dateValue: '2026-06-08',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
];

function loadAttendanceRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Unable to load stored records.', error);
  }
  return sampleRecords.slice();
}

function saveAttendanceRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn('Unable to save records.', error);
  }
}

let attendanceRecords = loadAttendanceRecords();

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3200);
}

function getBadgeClass(status) {
  switch (status) {
    case 'Hadir':
      return 'badge--hadir';
    case 'Sakit':
      return 'badge--sakit';
    case 'Izin':
      return 'badge--izin';
    case 'Alfa':
      return 'badge--alfa';
    case 'Terlambat':
      return 'badge--terlambat';
    default:
      return 'badge--default';
  }
}

function updateStats() {
  const total = attendanceRecords.length;
  const hadir = attendanceRecords.filter(item => item.status === 'Hadir').length;
  const sakit = attendanceRecords.filter(item => item.status === 'Sakit').length;
  const izin = attendanceRecords.filter(item => item.status === 'Izin').length;
  const alfa = attendanceRecords.filter(item => item.status === 'Alfa').length;
  const terlambat = attendanceRecords.filter(item => item.status === 'Terlambat').length;

  statTotal.textContent = total;
  statHadir.textContent = hadir;
  statSakit.textContent = sakit;
  statIzin.textContent = izin;
  statAlfa.textContent = alfa;
  statTerlambat.textContent = terlambat;
}

function updateSubmitState() {
  const hasFields = studentNameInput.value.trim() && studentNpmInput.value.trim() && studentClassInput.value.trim() && studentMajorInput.value.trim();
  submitAttendanceButton.disabled = !hasFields || !capturedImageBase64;
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    cameraPreview.srcObject = stream;
    capturePhotoButton.disabled = false;
    submitAttendanceButton.disabled = true;
    showNotification('Kamera aktif, silakan ambil foto.');
  } catch (error) {
    console.error(error);
    showNotification('Periksa izin kamera dan coba kembali.');
  }
}

function capturePhoto() {
  if (!stream) return;

  const videoTrack = stream.getVideoTracks()[0];
  const imageCapture = new ImageCapture(videoTrack);

  imageCapture.takePhoto().then(blob => {
    const reader = new FileReader();
    reader.onloadend = () => {
      capturedImageBase64 = reader.result;
      photoPreview.src = capturedImageBase64;
      photoPreviewWrapper.style.display = 'block';
      updateSubmitState();
      showNotification('Foto berhasil diambil.');
    };
    reader.readAsDataURL(blob);
  }).catch(() => {
    const canvas = document.createElement('canvas');
    canvas.width = cameraPreview.videoWidth;
    canvas.height = cameraPreview.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
    capturedImageBase64 = canvas.toDataURL('image/jpeg', 0.92);
    photoPreview.src = capturedImageBase64;
    photoPreviewWrapper.style.display = 'block';
    updateSubmitState();
    showNotification('Foto berhasil diambil.');
  });
}

function getFilteredAttendanceRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const date = dateFilter.value;

  return attendanceRecords.slice().reverse().filter(record => {
    const matchesQuery = !query || [record.nama, record.npm, record.kelas, record.jurusan].some(value => value.toLowerCase().includes(query));
    const matchesStatus = status === 'all' || record.status === status;
    const matchesDate = !date || record.dateValue === date;
    return matchesQuery && matchesStatus && matchesDate;
  });
}

function renderAttendanceTable() {
  attendanceTableBody.innerHTML = '';
  const filteredRecords = getFilteredAttendanceRecords();

  if (filteredRecords.length === 0) {
    attendanceTableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Tidak ada data yang sesuai filter.</td></tr>';
    return;
  }

  filteredRecords.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.nama}</td>
      <td>${record.npm}</td>
      <td>${record.kelas}</td>
      <td>${record.jurusan}</td>
      <td><span class="status-badge ${getBadgeClass(record.status)}">${record.status}</span></td>
      <td>${record.jam}</td>
      <td>${record.tanggal}</td>
      <td><img src="${record.foto}" alt="Foto ${record.nama}" /></td>
      <td>
        <button type="button" class="delete-button" data-id="${record.id}" aria-label="Hapus data ${record.nama}">
          🗑️
        </button>
      </td>
    `;
    attendanceTableBody.appendChild(row);
  });
}

function submitAttendance() {
  const nama = studentNameInput.value.trim();
  const npm = studentNpmInput.value.trim();
  const kelas = studentClassInput.value.trim();
  const jurusan = studentMajorInput.value.trim();
  const status = attendanceStatusSelect.value;

  if (!nama || !npm || !kelas || !jurusan) {
    showNotification('Semua kolom harus diisi sebelum absen.');
    return;
  }
  if (!capturedImageBase64) {
    showNotification('Silakan ambil foto terlebih dahulu.');
    return;
  }

  const now = new Date();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nama,
    npm,
    kelas,
    jurusan,
    status,
    tanggal: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    dateValue: now.toISOString().split('T')[0],
    jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    foto: capturedImageBase64,
  };

  submitAttendanceButton.disabled = true;
  submitAttendanceButton.textContent = 'Menyimpan...';

  attendanceRecords.push(record);
  saveAttendanceRecords(attendanceRecords);
  renderAttendanceTable();
  updateStats();

  showNotification('Data absensi berhasil tersimpan.');
  studentNameInput.value = '';
  studentNpmInput.value = '';
  studentClassInput.value = '';
  studentMajorInput.value = '';
  attendanceStatusSelect.value = 'Hadir';
  capturedImageBase64 = '';
  photoPreviewWrapper.style.display = 'none';
  submitAttendanceButton.textContent = 'Absen Masuk';
  updateSubmitState();
}

function refreshAttendanceData() {
  attendanceRecords = loadAttendanceRecords();
  renderAttendanceTable();
  updateStats();
  showNotification('Data absensi diperbarui.');
}

function openConfirmationDialog(id) {
  pendingDeleteId = id;
  confirmationOverlay.hidden = false;
  confirmationOverlay.setAttribute('aria-hidden', 'false');
  confirmYesButton.focus();
}

function closeConfirmationDialog() {
  pendingDeleteId = null;
  confirmationOverlay.hidden = true;
  confirmationOverlay.setAttribute('aria-hidden', 'true');
}

function deleteAttendanceRecord(id) {
  attendanceRecords = attendanceRecords.filter(record => record.id !== id);
  saveAttendanceRecords(attendanceRecords);
  renderAttendanceTable();
  updateStats();
  showNotification('Data absensi berhasil dihapus.');
}

function handleTableClick(event) {
  const button = event.target.closest('.delete-button');
  if (!button) return;
  const id = button.dataset.id;
  if (id) {
    openConfirmationDialog(id);
  }
}

startCameraButton.addEventListener('click', startCamera);
capturePhotoButton.addEventListener('click', capturePhoto);
submitAttendanceButton.addEventListener('click', submitAttendance);
refreshButton.addEventListener('click', refreshAttendanceData);
attendanceTableBody.addEventListener('click', handleTableClick);
confirmYesButton.addEventListener('click', () => {
  if (pendingDeleteId) {
    deleteAttendanceRecord(pendingDeleteId);
  }
  closeConfirmationDialog();
});
confirmNoButton.addEventListener('click', closeConfirmationDialog);

[studentNameInput, studentNpmInput, studentClassInput, studentMajorInput].forEach(input => {
  input.addEventListener('input', updateSubmitState);
});

[searchInput, statusFilter, dateFilter].forEach(control => {
  control.addEventListener('input', renderAttendanceTable);
});

window.addEventListener('click', event => {
  if (event.target === confirmationOverlay) {
    closeConfirmationDialog();
  }
});

renderAttendanceTable();
updateStats();
