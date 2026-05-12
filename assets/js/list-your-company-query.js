document.addEventListener('DOMContentLoaded', function () {
  var formPage = document.querySelector('.sc-form-page');
  if (!formPage) return;

  // Ensure footer layout is correct if CSS didn't load
  var footers = document.querySelectorAll('.sc-input-footer');
  footers.forEach(function (f) {
    f.style.display = 'flex';
    f.style.justifyContent = 'space-between';
    f.style.alignItems = 'center';
    f.style.width = '100%';
  });

  // Character count for textarea (short description)
  var textarea = document.querySelector('.sc-input-group textarea');
  var charCount = document.querySelector('.char-count');
  if (textarea && charCount) {
    var updateCount = function () {
      var len = textarea.value.length;
      var max = textarea.getAttribute('maxlength') || 160;
      charCount.textContent = len + ' / ' + max;
    };
    updateCount();
    textarea.addEventListener('input', updateCount);
  }

  // Logo upload: show filename in label when chosen
  var fileInput = document.getElementById('logo-upload');
  if (fileInput) {
    var fileLabel = document.querySelector('.sc-upload-box label');
    fileInput.addEventListener('change', function (e) {
      var name = (e.target.files && e.target.files[0] && e.target.files[0].name) || '';
      if (name && fileLabel) {
        var specs = fileLabel.querySelector('.specs');
        if (specs) specs.textContent = name;
      }
    });
  }

  // Simple tag entry: press Enter to add a tag
  var tagContainer = document.querySelector('.sc-tag-container');
  if (tagContainer) {
    var tagInput = tagContainer.querySelector('input');
    tagInput && tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var v = tagInput.value && tagInput.value.trim();
        if (!v) return;
        var span = document.createElement('span');
        span.className = 'sc-tag';
        span.textContent = v;
        tagContainer.insertBefore(span, tagInput);
        tagInput.value = '';
      }
    });
  }
});
