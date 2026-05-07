const REVIEW_STORAGE_KEY = 'customerReviews';
const REVIEW_STORAGE_LIMIT = 40;
const STAR_ICON_FILLED_SRC = 'assets/icons/star-filled.svg';
const STAR_ICON_OUTLINE_SRC = 'assets/icons/star-outline.svg';
const STAR_ICON_MAX = 5;

function onMediaQueryChange(mediaQuery, callback) {
    if (!mediaQuery || typeof callback !== 'function') return;
    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', callback);
        return;
    }
    if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(callback);
    }
}

function getScrollBehavior() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    return prefersReducedMotion.matches ? 'auto' : 'smooth';
}

function sanitizeText(value, maxLength) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function normalizeRating(value) {
    const rating = Number.parseInt(value, 10);
    if (!Number.isInteger(rating)) return 0;
    return Math.min(STAR_ICON_MAX, Math.max(0, rating));
}

function extractRatingFromText(text) {
    return Math.min(STAR_ICON_MAX, (String(text || '').match(/[⭐★]/g) || []).length);
}

function createStarImage(isFilled, className = 'review-star') {
    const image = document.createElement('img');
    image.className = className;
    image.src = isFilled ? STAR_ICON_FILLED_SRC : STAR_ICON_OUTLINE_SRC;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.decoding = 'async';
    return image;
}

function renderStarIcons(target, rating, max = STAR_ICON_MAX) {
    if (!target) return;

    const safeRating = Math.min(max, Math.max(0, normalizeRating(rating)));
    const fragment = document.createDocumentFragment();
    for (let index = 1; index <= max; index += 1) {
        fragment.appendChild(createStarImage(index <= safeRating));
    }

    target.textContent = '';
    target.appendChild(fragment);
    target.dataset.rating = String(safeRating);
    target.setAttribute('aria-label', `${safeRating} out of ${max} stars`);
}

function parseStoredReviews() {
    try {
        const raw = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || '[]');
        if (!Array.isArray(raw)) return [];

        return raw
            .map(item => {
                const rating = normalizeRating(item.rating);
                const name = sanitizeText(item.name, 60);
                const location = sanitizeText(item.location, 80);
                const review = sanitizeText(item.review, 700);
                const timestamp = sanitizeText(item.timestamp, 80);

                if (!rating) return null;
                if (!name || !location || !review) return null;

                return { rating, name, location, review, timestamp };
            })
            .filter(Boolean);
    } catch (_error) {
        return [];
    }
}

function persistReviews(reviews) {
    try {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews.slice(-REVIEW_STORAGE_LIMIT)));
        return true;
    } catch (_error) {
        return false;
    }
}

function showMessage(target, message, type) {
    if (!target) return;

    const existingTimer = Number(target.dataset.timeoutId || 0);
    if (existingTimer) window.clearTimeout(existingTimer);

    target.textContent = message;
    target.className = `form-message ${type}`;
    target.style.display = 'block';

    const timeoutId = window.setTimeout(() => {
        target.style.display = 'none';
        target.textContent = '';
        target.className = 'form-message';
        delete target.dataset.timeoutId;
    }, 5000);

    target.dataset.timeoutId = String(timeoutId);
}

// Smooth scrolling for navigation links.
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    links.forEach(anchor => {
        anchor.addEventListener('click', event => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
                behavior: getScrollBehavior(),
                block: 'start'
            });

            history.replaceState(null, '', href);
        });
    });
}

function initMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('navMenu');
    if (!navbar || !toggle || !menu) return;

    const mobileMedia = window.matchMedia('(max-width: 768px)');

    const setMenuState = isOpen => {
        navbar.classList.toggle('menu-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('nav-open', isOpen && mobileMedia.matches);
    };

    const closeMenu = () => setMenuState(false);

    toggle.addEventListener('click', () => {
        const isOpen = navbar.classList.contains('menu-open');
        setMenuState(!isOpen);
    });

    menu.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', () => {
            if (mobileMedia.matches) closeMenu();
        });
    });

    document.addEventListener('click', event => {
        if (!mobileMedia.matches) return;
        if (!navbar.classList.contains('menu-open')) return;
        if (navbar.contains(event.target)) return;
        closeMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeMenu();
    });

    onMediaQueryChange(mobileMedia, event => {
        if (!event.matches) closeMenu();
    });

    window.addEventListener('resize', () => {
        if (!mobileMedia.matches) closeMenu();
    });

    closeMenu();
}

function initActiveNavLink() {
    const links = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
    if (!links.length) return;

    const sections = links
        .map(link => {
            const hash = link.getAttribute('href');
            const section = hash ? document.querySelector(hash) : null;
            if (!section) return null;
            return { hash, section };
        })
        .filter(Boolean);

    if (!sections.length) return;

    let lastActive = null;

    const setActive = hash => {
        if (hash === lastActive) return;          // skip if already active
        lastActive = hash;
        links.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === hash);
        });
    };

    const nav = document.querySelector('.navbar');
    let rafPending = false;

    const syncActiveLink = () => {
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;

        const marker = Math.max(navHeight + 24, window.innerHeight * 0.35);
        let current = sections[0].hash;
        let bestTop = Number.NEGATIVE_INFINITY;

        sections.forEach(item => {
            const top = item.section.getBoundingClientRect().top;
            if (top <= marker && top > bestTop) {
                bestTop = top;
                current = item.hash;
            }
        });

        setActive(current);
        rafPending = false;
    };

    const onScroll = () => {
        if (rafPending) return;
        rafPending = true;
        window.requestAnimationFrame(syncActiveLink);
    };

    syncActiveLink();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);

    if (window.location.hash) {
        setActive(window.location.hash);
    }
}

// Contact form handling.
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    if (!contactForm || !formMessage) return;

    contactForm.addEventListener('submit', async event => {
        event.preventDefault();

        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        if (!phoneInput || !emailInput || !submitButton) return;

        const phoneDigits = phoneInput.value.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 15) {
            showMessage(formMessage, 'Please enter a valid phone number with area code.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            showMessage(formMessage, 'Please enter a valid email address.', 'error');
            return;
        }

        submitButton.disabled = true;
        const formData = new FormData(contactForm);

        try {
            const response = await fetch('https://formspree.io/f/mjgwglrw', {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json'
                }
            });

            if (response.ok) {
                showMessage(formMessage, 'Thank you. Your request has been received and we will contact you soon.', 'success');
                contactForm.reset();
                return;
            }

            const responseBody = await response.json().catch(() => ({}));
            if (responseBody && responseBody.errors) {
                showMessage(formMessage, 'There was a problem with your submission. Please check your details and try again.', 'error');
            } else {
                showMessage(formMessage, 'Oops. There was a problem submitting your form.', 'error');
            }
        } catch (_error) {
            showMessage(formMessage, 'Sorry, there was a network error. Please try again shortly.', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });
}

// Navbar shadow on scroll.
function initNavbarShadow() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    let isScrolled = false;

    const updateNavbarShadow = () => {
        const y = window.scrollY;
        // Hysteresis: scroll down past 80 to add, scroll up past 40 to remove
        if (!isScrolled && y > 80) {
            isScrolled = true;
            navbar.classList.add('is-scrolled');
        } else if (isScrolled && y < 40) {
            isScrolled = false;
            navbar.classList.remove('is-scrolled');
        }
        ticking = false;
    };

    updateNavbarShadow();
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateNavbarShadow);
    }, { passive: true });
}

// North American-friendly phone formatting for quick readability.
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', event => {
        let digits = event.target.value.replace(/\D/g, '').slice(0, 15);
        if (!digits) {
            event.target.value = '';
            return;
        }

        const hasCountryCode = digits.length === 11 && digits.startsWith('1');
        if (digits.length > 10 && !hasCountryCode) {
            event.target.value = `+${digits}`;
            return;
        }
        if (hasCountryCode) {
            digits = digits.slice(1);
        }

        let formatted = '';
        if (digits.length <= 3) {
            formatted = `(${digits}`;
        } else if (digits.length <= 6) {
            formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else {
            formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }

        event.target.value = hasCountryCode ? `+1 ${formatted}` : formatted;
    });
}

// Reveal animations with stagger per section.
function initRevealAnimations() {
    const items = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    // Group items by parent section for better per-section stagger
    const sections = new Map();
    items.forEach(item => {
        const section = item.closest('section') || item.parentElement;
        if (!sections.has(section)) sections.set(section, []);
        sections.get(section).push(item);
    });

    sections.forEach(sectionItems => {
        sectionItems.forEach((item, index) => {
            item.style.setProperty('--reveal-delay', `${index * 80}ms`);
        });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const revealAll = () => {
        items.forEach(item => {
            item.classList.add('is-visible');
            item.style.removeProperty('--reveal-delay');
        });
    };

    if (prefersReducedMotion.matches) {
        revealAll();
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.14,
        rootMargin: '0px 0px -6% 0px'
    });

    items.forEach(item => observer.observe(item));

    onMediaQueryChange(prefersReducedMotion, event => {
        if (event.matches) revealAll();
    });
}

// Review carousel.
function initReviewCarousel() {
    const slider = document.querySelector('.reviews-slider');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    if (!slider) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let autoScrollInterval = null;

    const getScrollAmount = () => {
        const firstCard = slider.querySelector('.review-card');
        if (!firstCard) return 0;
        const gapValue = Number.parseFloat(getComputedStyle(slider).gap || 0);
        return firstCard.getBoundingClientRect().width + gapValue;
    };

    const scrollNext = () => {
        const scrollAmount = getScrollAmount();
        if (!scrollAmount) return;

        const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
        const nextPosition = slider.scrollLeft + scrollAmount;
        const behavior = getScrollBehavior();
        if (nextPosition >= maxScrollLeft - 5) {
            slider.scrollTo({ left: 0, behavior });
        } else {
            slider.scrollBy({ left: scrollAmount, behavior });
        }
    };

    const scrollPrev = () => {
        const scrollAmount = getScrollAmount();
        if (!scrollAmount) return;

        const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
        const behavior = getScrollBehavior();
        if (slider.scrollLeft <= 5) {
            slider.scrollTo({ left: maxScrollLeft, behavior });
        } else {
            slider.scrollBy({ left: -scrollAmount, behavior });
        }
    };

    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            window.clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    };

    const startAutoScroll = () => {
        stopAutoScroll();
        if (prefersReducedMotion.matches || document.hidden) return;
        autoScrollInterval = window.setInterval(scrollNext, 6500);
    };

    const resetAutoScroll = () => {
        startAutoScroll();
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scrollPrev();
            resetAutoScroll();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scrollNext();
            resetAutoScroll();
        });
    }

    slider.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            scrollPrev();
            resetAutoScroll();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            scrollNext();
            resetAutoScroll();
        } else if (event.key === 'Home') {
            event.preventDefault();
            slider.scrollTo({ left: 0, behavior: getScrollBehavior() });
        } else if (event.key === 'End') {
            event.preventDefault();
            slider.scrollTo({ left: slider.scrollWidth, behavior: getScrollBehavior() });
        }
    });

    slider.addEventListener('mouseenter', stopAutoScroll);
    slider.addEventListener('mouseleave', startAutoScroll);
    slider.addEventListener('focusin', stopAutoScroll);
    slider.addEventListener('focusout', () => {
        if (!slider.contains(document.activeElement)) startAutoScroll();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
    });

    onMediaQueryChange(prefersReducedMotion, event => {
        if (event.matches) stopAutoScroll();
        else startAutoScroll();
    });

    startAutoScroll();
}

function normalizeStaticReviewStars() {
    const starContainers = Array.from(document.querySelectorAll('.reviews .stars'));
    if (!starContainers.length) return;

    starContainers.forEach(container => {
        const explicitRating = normalizeRating(container.dataset.rating);
        const textRating = extractRatingFromText(container.textContent);
        const rating = explicitRating || textRating;
        renderStarIcons(container, rating);
    });
}

function createReviewCard(data) {
    const card = document.createElement('div');
    card.className = 'review-card is-visible';

    const stars = document.createElement('div');
    stars.className = 'stars';
    renderStarIcons(stars, data.rating);

    const reviewText = document.createElement('p');
    reviewText.className = 'review-text';
    reviewText.textContent = `"${data.review}"`;

    const reviewer = document.createElement('div');
    reviewer.className = 'reviewer';

    const name = document.createElement('strong');
    name.textContent = data.name;

    const location = document.createElement('span');
    location.textContent = data.location;

    reviewer.append(name, location);
    card.append(stars, reviewText, reviewer);
    return card;
}

function addReviewToCarousel(reviewData, options = {}) {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;

    slider.appendChild(createReviewCard(reviewData));
    if (options.scrollToEnd) {
        slider.scrollTo({ left: slider.scrollWidth, behavior: getScrollBehavior() });
    }
}

function storeReview(reviewData) {
    const stored = parseStoredReviews();
    stored.push(reviewData);
    return persistReviews(stored);
}

function hydrateStoredReviews() {
    const stored = parseStoredReviews();
    stored.forEach(review => addReviewToCarousel(review));
}

function initStarRating() {
    const stars = Array.from(document.querySelectorAll('.star-rating .star'));
    const ratingInput = document.getElementById('rating');
    if (!stars.length || !ratingInput) return;

    stars.forEach(star => {
        let icon = star.querySelector('.star-icon');
        if (icon) return;
        icon = createStarImage(false, 'star-icon');
        star.textContent = '';
        star.appendChild(icon);
    });

    let selectedRating = Number.parseInt(ratingInput.value || '0', 10) || 0;

    const paintStars = (activeRating, pressedRating = selectedRating) => {
        stars.forEach(star => {
            const starValue = Number.parseInt(star.getAttribute('data-rating') || '0', 10);
            const isActive = starValue <= activeRating;
            const isPressed = starValue === pressedRating;
            const icon = star.querySelector('.star-icon');

            star.classList.toggle('active', isActive);
            star.setAttribute('aria-pressed', String(isPressed));
            if (icon) {
                icon.src = isActive ? STAR_ICON_FILLED_SRC : STAR_ICON_OUTLINE_SRC;
            }
        });
    };

    const setRating = ratingValue => {
        const rating = Math.min(5, Math.max(0, Number.parseInt(ratingValue, 10) || 0));
        selectedRating = rating;
        ratingInput.value = String(rating);
        paintStars(selectedRating);
    };

    const previewRating = ratingValue => {
        const rating = Math.min(5, Math.max(0, Number.parseInt(ratingValue, 10) || 0));
        paintStars(rating);
    };

    stars.forEach(star => {
        star.addEventListener('click', () => {
            setRating(star.getAttribute('data-rating'));
        });

        star.addEventListener('mouseenter', () => {
            previewRating(star.getAttribute('data-rating'));
        });

        star.addEventListener('focus', () => {
            previewRating(star.getAttribute('data-rating'));
        });

        star.addEventListener('keydown', event => {
            let nextRating = selectedRating;

            if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                nextRating = Math.min(5, selectedRating + 1);
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                nextRating = Math.max(1, selectedRating - 1);
            } else if (event.key === 'Home') {
                nextRating = 1;
            } else if (event.key === 'End') {
                nextRating = 5;
            } else if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            if (event.key === 'Enter' || event.key === ' ') {
                setRating(star.getAttribute('data-rating'));
                return;
            }

            setRating(nextRating);
            const targetStar = stars[nextRating - 1];
            if (targetStar) targetStar.focus();
        });
    });

    const ratingContainer = document.querySelector('.star-rating');
    if (ratingContainer) {
        ratingContainer.addEventListener('mouseleave', () => {
            paintStars(selectedRating);
        });

        ratingContainer.addEventListener('focusout', () => {
            if (!ratingContainer.contains(document.activeElement)) {
                paintStars(selectedRating);
            }
        });
    }

    setRating(0);
    return setRating;
}

function initReviewForm(setRating) {
    const reviewForm = document.getElementById('reviewForm');
    const reviewMessage = document.getElementById('reviewMessage');
    if (!reviewForm || !reviewMessage) return;

    reviewForm.addEventListener('submit', event => {
        event.preventDefault();

        const rating = normalizeRating(document.getElementById('rating')?.value || '0');
        const name = sanitizeText(document.getElementById('reviewerName')?.value, 60);
        const location = sanitizeText(document.getElementById('reviewerLocation')?.value, 80);
        const reviewText = sanitizeText(document.getElementById('reviewText')?.value, 700);

        if (!rating) {
            showMessage(reviewMessage, 'Please select a star rating.', 'error');
            return;
        }
        if (!name || !location || !reviewText) {
            showMessage(reviewMessage, 'Please complete your name, location, and review text.', 'error');
            return;
        }

        const reviewData = {
            rating,
            name,
            location,
            review: reviewText,
            timestamp: new Date().toISOString()
        };

        const isStored = storeReview(reviewData);
        addReviewToCarousel(reviewData, { scrollToEnd: true });
        if (isStored) {
            showMessage(reviewMessage, 'Thank you for your review. It has been added to the carousel.', 'success');
        } else {
            showMessage(reviewMessage, 'Thanks for your review. It was added for this session, but storage is unavailable on this browser.', 'success');
        }

        reviewForm.reset();
        if (typeof setRating === 'function') setRating(0);
    });
}

function initCurrentYear() {
    const yearTarget = document.getElementById('currentYear');
    if (!yearTarget) return;
    yearTarget.textContent = String(new Date().getFullYear());
}

window.getCustomerReviews = function getCustomerReviews() {
    return parseStoredReviews();
};

// ═══════════════════════════════════════════════
// SCISSORS SCROLL PROGRESS BAR
// ═══════════════════════════════════════════════
function initScrollProgress() {
    const fill = document.querySelector('.scroll-progress-fill');
    const scissors = document.querySelector('.scroll-scissors');
    const bar = document.querySelector('.scroll-progress');
    if (!fill) return;

    let ticking = false;
    const mobileQuery = window.matchMedia('(max-width: 768px)');

    // Position bar just below the navbar on desktop
    const navbar = document.querySelector('.navbar');
    const positionBar = () => {
        if (!mobileQuery.matches && navbar && bar) {
            bar.style.top = navbar.offsetHeight + 'px';
        } else if (bar) {
            bar.style.top = '0';
        }
    };

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
        const pct = progress * 100;

        positionBar();

        if (mobileQuery.matches) {
            // Mobile: vertical left-side bar
            fill.style.width = '';
            fill.style.height = `${pct}%`;
            if (scissors) {
                scissors.style.transform = `translateX(-50%) rotate(${90 + progress * 20}deg)`;
                scissors.style.opacity = progress > 0.02 ? '1' : '0';
            }
        } else {
            // Desktop: horizontal bar under navbar
            fill.style.height = '';
            fill.style.width = `${pct}%`;
            if (scissors) {
                scissors.style.transform = `translateY(-50%) rotate(0deg)`;
                scissors.style.opacity = progress > 0.02 ? '1' : '0';
            }
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateProgress);
    }, { passive: true });

    window.addEventListener('resize', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateProgress);
    });

    updateProgress();
}

// ═══════════════════════════════════════════════
// MOBILE BOTTOM CTA BAR
// ═══════════════════════════════════════════════
function initMobileCTA() {
    const bar = document.getElementById('mobileCTA');
    if (!bar) return;

    const dismissButton = bar.querySelector('.mobile-cta-dismiss');
    if (dismissButton) {
        dismissButton.addEventListener('click', () => {
            bar.classList.add('dismissed');
        });
    }

    const mobileMedia = window.matchMedia('(max-width: 768px)');
    if (!mobileMedia.matches) return;

    let visible = false;

    const update = () => {
        const heroEnd = window.innerHeight * 0.85;
        const contactEl = document.getElementById('contact');
        const contactTop = contactEl
            ? contactEl.getBoundingClientRect().top
            : Infinity;

        const shouldShow = window.scrollY > heroEnd && contactTop > window.innerHeight * 0.5;

        if (shouldShow !== visible) {
            visible = shouldShow;
            bar.classList.toggle('is-visible', visible);
        }
    };

    window.addEventListener('scroll', () => {
        window.requestAnimationFrame(update);
    }, { passive: true });

    update();
}

// ═══════════════════════════════════════════════
// STITCH DIVIDER ANIMATION
// ═══════════════════════════════════════════════
function initStitchDividers() {
    const sections = document.querySelectorAll('section');
    if (!sections.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        sections.forEach(s => s.classList.add('stitch-visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('stitch-visible');
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -10% 0px'
    });

    sections.forEach(s => observer.observe(s));
}

// ═══════════════════════════════════════════════
// PARALLAX GLOW ORBS (Hero section)
// ═══════════════════════════════════════════════
function initParallaxGlow() {
    const glow = document.querySelector('.hero-glow');
    if (!glow) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) return;

    let ticking = false;

    const updateParallax = () => {
        const scrollY = window.scrollY;
        const heroHeight = document.querySelector('.hero')?.offsetHeight || 600;

        if (scrollY < heroHeight) {
            const offset = scrollY * 0.15;
            glow.style.transform = `translateY(${offset}px)`;
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateParallax);
    }, { passive: true });
}

// ═══════════════════════════════════════════════
// SUBTLE TILT EFFECT ON HERO CARD (desktop only)
// ═══════════════════════════════════════════════
function initCardTilt() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) return;

    const isMobile = window.matchMedia('(max-width: 768px)');
    if (isMobile.matches) return;

    const cards = document.querySelectorAll('.hero-card');
    if (!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', event => {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -2;
            const rotateY = ((x - centerX) / centerX) * 2;

            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initCurrentYear();
    initSmoothScroll();
    initMobileMenu();
    initActiveNavLink();
    initContactForm();
    initNavbarShadow();
    initPhoneFormatting();
    initRevealAnimations();
    normalizeStaticReviewStars();
    hydrateStoredReviews();
    initReviewCarousel();
    const setRating = initStarRating();
    initReviewForm(setRating);

    // New animations
    initScrollProgress();
    initMobileCTA();
    initStitchDividers();
    initParallaxGlow();
    initCardTilt();
});
