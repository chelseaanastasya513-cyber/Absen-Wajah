const startCameraButton = document.getElementById('startCamera');
const capturePhotoButton = document.getElementById('capturePhoto');
const submitAttendanceButton = document.getElementById('submitAttendance');
const cameraPreview = document.getElementById('cameraPreview');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewWrapper = document.getElementById('photoPreviewWrapper');
const notification = document.getElementById('notification');
const studentNameInput = document.getElementById('studentName');
const studentNisInput = document.getElementById('studentNis');
const studentClassInput = document.getElementById('studentClass');
const studentMajorInput = document.getElementById('studentMajor');
const attendanceTableBody = document.getElementById('attendanceTableBody');

let stream = null;
let capturedImageBase64 = '';
const attendanceRecords = [];

const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

function showNotification(message) {
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3200);
}

function updateSubmitState() {
  const hasFields = studentNameInput.value.trim() && studentNisInput.value.trim() && studentClassInput.value.trim() && studentMajorInput.value.trim();
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
    showNotification('Tidak dapat mengaktifkan kamera. Periksa izin atau perangkat.');
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
      <td>${record.nis}</td>
      <td>${record.kelas}</td>
      <td>${record.jurusan}</td>
      <td>${record.jam}</td>
      <td>${record.tanggal}</td>
      <td><img src="${record.foto}" alt="Foto ${record.nama}" /></td>
    `;
    attendanceTableBody.appendChild(row);
  });
}

async function submitAttendance() {
  const nama = studentNameInput.value.trim();
  const nis = studentNisInput.value.trim();
  const kelas = studentClassInput.value.trim();
  const jurusan = studentMajorInput.value.trim();

  if (!nama || !nis || !kelas || !jurusan) {
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
    nis,
    kelas,
    jurusan,
    tanggal: now.toLocaleDateString('id-ID'),
    jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    foto: capturedImageBase64,
  };

  submitAttendanceButton.disabled = true;
  submitAttendanceButton.textContent = 'Menyimpan...';

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error('Respons server tidak valid');
    }

    attendanceRecords.push(record);
    renderAttendanceTable();

    showNotification('Absensi berhasil');
    studentNameInput.value = '';
    studentNisInput.value = '';
    studentClassInput.value = '';
    studentMajorInput.value = '';
    capturedImageBase64 = '';
    photoPreviewWrapper.style.display = 'none';
  } catch (error) {
    console.error(error);
    showNotification('Data tidak berhasil tersimpan. Coba lagi.');
  } finally {
    submitAttendanceButton.textContent = 'Absen Masuk';
    updateSubmitState();
  }
}

startCameraButton.addEventListener('click', startCamera);
capturePhotoButton.addEventListener('click', capturePhoto);
submitAttendanceButton.addEventListener('click', submitAttendance);

[studentNameInput, studentNisInput, studentClassInput, studentMajorInput].forEach(input => {
  input.addEventListener('input', updateSubmitState);
});

renderAttendanceTable();
