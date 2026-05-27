var photos = [];
var lightboxIndex = 0;
var touchStartX = 0;

var grid        = document.getElementById('gallery-grid');
var empty       = document.getElementById('gallery-empty');
var countEl     = document.getElementById('gallery-count');
var lightbox    = document.getElementById('gallery-lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var captionEl   = document.getElementById('lightbox-caption');
var counterEl   = document.getElementById('lightbox-counter');

function openLightbox(index) {
    lightboxIndex = index;
    var p = photos[index];
    lightboxImg.src = '/photos/slideshow/' + p.id;
    lightboxImg.alt = p.note || 'Photo by ' + p.uploader;
    captionEl.innerHTML = p.note
        ? '\u{1F4F8} ' + p.uploader + '<br><span>' + p.note + '</span>'
        : '\u{1F4F8} ' + p.uploader;
    counterEl.textContent = (index + 1) + ' / ' + photos.length;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
}

function lightboxGo(dir) {
    openLightbox(((lightboxIndex + dir) % photos.length + photos.length) % photos.length);
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-prev').addEventListener('click', function () { lightboxGo(-1); });
document.getElementById('lightbox-next').addEventListener('click', function () { lightboxGo(1); });

lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
});

lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) lightboxGo(dx < 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lightboxGo(-1);
    if (e.key === 'ArrowRight')  lightboxGo(1);
});

fetch('/photos/gallery/list', {
    headers: { 'Authorization': 'Bearer ' + getJWT() }
})
    .then(function (r) { return r.json(); })
    .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) {
            empty.style.display = 'block';
            return;
        }
        photos = data;
        countEl.textContent = photos.length + ' photo' + (photos.length === 1 ? '' : 's');

        photos.forEach(function (p, i) {
            var cell = document.createElement('div');
            cell.className = 'gallery-thumb';
            var img = document.createElement('img');
            img.loading = 'lazy';
            img.src = '/photos/slideshow/' + p.id;
            img.alt = p.note || 'Photo by ' + p.uploader;
            cell.appendChild(img);
            cell.addEventListener('click', function () { openLightbox(i); });
            grid.appendChild(cell);
        });
    })
    .catch(function (err) {
        console.warn('Could not load gallery:', err);
        empty.textContent = 'Failed to load photos. Please try again.';
        empty.style.display = 'block';
    });
