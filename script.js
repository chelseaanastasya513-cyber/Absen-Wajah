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
const attendanceTableBody = document.getElementById('attendanceTableBody');

let stream = null;
let capturedImageBase64 = '';
const STORAGE_KEY = 'attendanceRecords';

const sampleRecords = [
  {
    nama: 'Rina Aulia',
    npm: '2101021001',
    kelas: 'TI-1',
    jurusan: 'Teknik Informatika',
    jam: '07:45:12',
    tanggal: '08 Juni 2026',
    foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  {
    nama: 'Idham Pratama',
    npm: '2101021002',
    kelas: 'TI-1',
    jurusan: 'Teknik Informatika',
    jam: '07:48:05',
    tanggal: '08 Juni 2026',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  {
    nama: 'Sarah Wijaya',
    npm: '2101021003',
    kelas: 'TI-2',
    jurusan: 'Teknik Informatika',
    jam: '07:50:30',
    tanggal: '08 Juni 2026',
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

const attendanceRecords = loadAttendanceRecords();

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3200);
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

function renderAttendanceTable() {
  attendanceTableBody.innerHTML = '';

  if (attendanceRecords.length === 0) {
    attendanceTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">Belum ada data absensi.</td></tr>';
    return;
  }

  attendanceRecords.slice().reverse().forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.nama}</td>
      <td>${record.npm}</td>
      <td>${record.kelas}</td>
      <td>${record.jurusan}</td>
      <td>${record.jam}</td>
      <td>${record.tanggal}</td>
      <td><img src="${record.foto}" alt="Foto ${record.nama}" /></td>
    `;
    attendanceTableBody.appendChild(row);
  });
}

function submitAttendance() {
  const nama = studentNameInput.value.trim();
  const npm = studentNpmInput.value.trim();
  const kelas = studentClassInput.value.trim();
  const jurusan = studentMajorInput.value.trim();

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
    nama,
    npm,
    kelas,
    jurusan,
    tanggal: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    foto: capturedImageBase64,
  };

  submitAttendanceButton.disabled = true;
  submitAttendanceButton.textContent = 'Menyimpan...';

  attendanceRecords.push(record);
  saveAttendanceRecords(attendanceRecords);
  renderAttendanceTable();

  showNotification('Data absensi berhasil tersimpan.');
  studentNameInput.value = '';
  studentNpmInput.value = '';
  studentClassInput.value = '';
  studentMajorInput.value = '';
  capturedImageBase64 = '';
  photoPreviewWrapper.style.display = 'none';
  submitAttendanceButton.textContent = 'Absen Masuk';
  updateSubmitState();
}

startCameraButton.addEventListener('click', startCamera);
capturePhotoButton.addEventListener('click', capturePhoto);
submitAttendanceButton.addEventListener('click', submitAttendance);

[studentNameInput, studentNpmInput, studentClassInput, studentMajorInput].forEach(input => {
  input.addEventListener('input', updateSubmitState);
});

renderAttendanceTable();
