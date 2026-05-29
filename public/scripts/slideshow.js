var photos  = [];
var current = 0;
var timer   = null;
var INTERVAL_MS = 6000;

var section    = document.getElementById('photo-slideshow');
var track      = document.getElementById('slideshow-track');
var trackWrap  = document.querySelector('.slideshow-track-wrap');
var dotsWrap   = document.getElementById('slideshow-dots');
var caption    = document.getElementById('slideshow-caption');

// Horizontal swipe to advance slides
var swipeStartX = 0;
var swipeStartY = 0;
var swiping     = false;

trackWrap.addEventListener('touchstart', function (e) {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swiping = false;
}, { passive: true });

trackWrap.addEventListener('touchmove', function (e) {
    var dx = e.touches[0].clientX - swipeStartX;
    var dy = e.touches[0].clientY - swipeStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        swiping = true;
        e.preventDefault(); // block vertical page-snap while swiping horizontally
    }
}, { passive: false });

trackWrap.addEventListener('touchend', function (e) {
    if (!swiping) return;
    var dx = e.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(dx) > 40) advance(dx < 0 ? 1 : -1);
    swiping = false;
}, { passive: true });;

function goTo(index) {
    current = ((index % photos.length) + photos.length) % photos.length;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dotsWrap.querySelectorAll('.slideshow-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === current);
    });
    var p = photos[current];
    caption.innerHTML = '\u{1F4F8} ' + toCamelCase(p.uploader) + '<br>' + (p.note || ' ');
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

function toCamelCase(str) {
    var result = str.toLowerCase();
    var newLetter = result[0].toUpperCase();
    result = newLetter + result.slice(1);
    
    var last = 0;
    while (str.indexOf(' ', last) > 0) {
        let idx = str.indexOf(' ', last) + 1;
        newLetter = result[idx].toUpperCase();
        result = result.slice(0, idx) + newLetter + result.slice(idx + 1);
        last = idx + 1;
    }
    return result;
}

makeAuthenticatedRequest('GET', '/photos/slideshow')
    .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        photos = data;
        section.style.display = 'block';

        // build slides
        photos.forEach(function (p) {
            var slide = document.createElement('div');
            slide.className = 'slideshow-slide';
            var img = document.createElement('img');
            img.src = '/photos/view/' + p.id;
            img.alt = p.note || ('Photo by ' + p.uploader);
            slide.appendChild(img);
            track.appendChild(slide);
        });

        for (var i = 0; i < photos.length; i++) {
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
