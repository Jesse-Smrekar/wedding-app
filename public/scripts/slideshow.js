var photos  = [];
var current = 0;
var timer   = null;
var INTERVAL_MS = 10000;

var section  = document.getElementById('photo-slideshow');
var track    = document.getElementById('slideshow-track');
var dotsWrap = document.getElementById('slideshow-dots');
var caption  = document.getElementById('slideshow-caption');
// var prevBtn  = document.getElementById('slideshow-prev');
// var nextBtn  = document.getElementById('slideshow-next');

function goTo(index) {
    current = ((index % photos.length) + photos.length) % photos.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dotsWrap.querySelectorAll('.slideshow-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === current);
    });
    var p = photos[current];
    caption.innerHTML = '\u{1F4F8} ' + p.uploader + '<br>' + (p.note || ' ');
}

function startTimer() {
    clearInterval(timer);
    if (photos.length > 1) {
        timer = setInterval(function () { goTo(current + 1); }, INTERVAL_MS);
    }
}

function advance(dir) {
    goTo(current + dir);
    startTimer();
}

fetch('/photos/slideshow')
    .then(function (r) { return r.json(); })
    .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        photos = data;
        section.style.display = 'block';

        // build slides
        photos.forEach(function (p) {
            var slide = document.createElement('div');
            slide.className = 'slideshow-slide';
            var img = document.createElement('img');
            img.src = '/photos/slideshow/' + p.id;
            img.alt = p.note || ('Photo by ' + p.uploader);
            slide.appendChild(img);
            track.appendChild(slide);
        });

        // build dots (cap at 20 so they don't overflow on many photos)
        var dotCount = Math.min(photos.length, 20);
        for (var i = 0; i < dotCount; i++) {
            (function (idx) {
                var dot = document.createElement('button');
                dot.className = 'slideshow-dot' + (idx === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to photo ' + (idx + 1));
                dot.addEventListener('click', function () { goTo(idx); startTimer(); });
                dotsWrap.appendChild(dot);
            })(i);
        }

        goTo(0);
        startTimer();
    })
    .catch(function (err) {
        console.warn('Could not load guest photo slideshow:', err);
    });

// prevBtn.addEventListener('click', function () { advance(-1); });
// nextBtn.addEventListener('click', function () { advance(1); });
