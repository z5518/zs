
document.addEventListener('DOMContentLoaded', function() {
  let cropper;
  const cropModal = document.getElementById('cropModal');
  const cropImage = document.getElementById('cropImage');
  const confirmCrop = document.getElementById('confirmCrop');
  const cancelCrop = document.getElementById('cancelCrop');
  let activeImageElement = null;

  function handleUpload(uploadElementId, avatarImageId) {
    const upload = document.getElementById(uploadElementId);
    const avatarImg = document.getElementById(avatarImageId);

    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        cropImage.src = event.target.result;
        cropModal.classList.remove('hidden');
        activeImageElement = avatarImg;

        if (cropper) cropper.destroy();
        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
          responsive: true,
          zoomable: false, // 禁用缩放
          scalable: false,
          movable: false,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  confirmCrop.addEventListener('click', () => {
    if (activeImageElement && cropper) {
      const canvas = cropper.getCroppedCanvas({ width: 200, height: 200 });
      activeImageElement.src = canvas.toDataURL();
    }
    cropModal.classList.add('hidden');
    cropper.destroy();
  });

  cancelCrop.addEventListener('click', () => {
    cropModal.classList.add('hidden');
    cropper.destroy();
  });

  if (document.getElementById('avatar-upload')) {
    handleUpload('avatar-upload', 'avatar-img');
  } else if (document.getElementById('certificate-avatar-upload')) {
    handleUpload('certificate-avatar-upload', 'certificate-avatar-img');
  }
});
