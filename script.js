// Smooth scrolling for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
}

// Form handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    if (!contactForm || !formMessage) return;

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');
        if (!phoneInput || !emailInput) return;

        const phoneRegex = /^[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phoneInput.value)) {
            showMessage(formMessage, 'Please enter a valid phone number.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            showMessage(formMessage, 'Please enter a valid email address.', 'error');
            return;
        }

        const formData = new FormData(contactForm);

        fetch('https://formspree.io/f/mjgwglrw', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    showMessage(formMessage, 'Thank you! Your request has been received. We will contact you soon.', 'success');
                    contactForm.reset();
                } else {
                    return response.json().then(data => {
                        if (data.errors) {
                            showMessage(formMessage, 'There was a problem with your submission. Please try again.', 'error');
                        } else {
                            showMessage(formMessage, 'Oops! There was a problem submitting your form.', 'error');
                        }
                    });
                }
            })
            .catch(() => {
                showMessage(formMessage, 'Sorry, there was an error. Please try again or contact us directly.', 'error');
            });
    });
}

function showMessage(target, message, type) {
    target.textContent = message;
    target.className = `form-message ${type}`;
    target.style.display = 'block';

    setTimeout(() => {
        target.style.display = 'none';
    }, 5000);
}

// Navbar shadow on scroll
function initNavbarShadow() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 80) {
            navbar.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
        } else {
            navbar.style.boxShadow = '0 8px 20px rgba(0,0,0,0.05)';
        }
    });
}

// Phone number formatting
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }

        e.target.value = value;
    });
}

// Reveal animations
function initRevealAnimations() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        items.forEach(item => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(item => observer.observe(item));
}

// Review carousel
function initReviewCarousel() {
    const slider = document.querySelector('.reviews-slider');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    if (!slider) return;

    const getCards = () => Array.from(slider.querySelectorAll('.review-card'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let autoScrollInterval;

    const getScrollAmount = () => {
        const cards = getCards();
        if (!cards.length) return 0;
        const gapValue = parseFloat(getComputedStyle(slider).gap || 0);
        return cards[0].getBoundingClientRect().width + gapValue;
    };

    const scrollNext = () => {
        const scrollAmount = getScrollAmount();
        if (!scrollAmount) return;

        const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
        const nextPosition = slider.scrollLeft + scrollAmount;
        if (nextPosition >= maxScrollLeft - 5) {
            slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollPrev = () => {
        const scrollAmount = getScrollAmount();
        if (!scrollAmount) return;

        if (slider.scrollLeft <= 5) {
            slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' });
        } else {
            slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    const startAutoScroll = () => {
        if (prefersReducedMotion.matches) return;
        autoScrollInterval = setInterval(scrollNext, 6500);
    };

    const stopAutoScroll = () => {
        clearInterval(autoScrollInterval);
    };

    const resetAutoScroll = () => {
        stopAutoScroll();
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

    slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            scrollPrev();
            resetAutoScroll();
        }
        if (e.key === 'ArrowRight') {
            scrollNext();
            resetAutoScroll();
        }
    });

    slider.addEventListener('mouseenter', stopAutoScroll);
    slider.addEventListener('mouseleave', startAutoScroll);
    slider.addEventListener('focusin', stopAutoScroll);
    slider.addEventListener('focusout', startAutoScroll);

    prefersReducedMotion.addEventListener('change', (event) => {
        if (event.matches) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
    });

    startAutoScroll();
}

// Star Rating System
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    if (!stars.length || !ratingInput) return;

    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            ratingInput.value = rating;

            stars.forEach(s => {
                const starRating = s.getAttribute('data-rating');
                if (starRating <= rating) {
                    s.classList.add('active');
                    s.textContent = '★';
                } else {
                    s.classList.remove('active');
                    s.textContent = '☆';
                }
            });
        });

        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            stars.forEach(s => {
                const starRating = s.getAttribute('data-rating');
                s.style.color = starRating <= rating ? 'var(--gold)' : '#ddd';
            });
        });
    });

    const starRating = document.querySelector('.star-rating');
    if (!starRating) return;

    starRating.addEventListener('mouseleave', function() {
        const currentRating = ratingInput.value;
        stars.forEach(s => {
            const starRating = s.getAttribute('data-rating');
            s.style.color = starRating <= currentRating ? 'var(--gold)' : '#ddd';
        });
    });
}

// Review Form Submission
function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewMessage = document.getElementById('reviewMessage');
    if (!reviewForm || !reviewMessage) return;

    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const rating = document.getElementById('rating').value;
        const name = document.getElementById('reviewerName').value;
        const location = document.getElementById('reviewerLocation').value;
        const reviewText = document.getElementById('reviewText').value;

        if (rating === '0') {
            showMessage(reviewMessage, 'Please select a star rating.', 'error');
            return;
        }

        const reviewData = {
            rating: parseInt(rating, 10),
            name: name,
            location: location,
            review: reviewText,
            timestamp: new Date().toISOString()
        };

        storeReview(reviewData);
        addReviewToCarousel(reviewData);
        showMessage(reviewMessage, 'Thank you for your review! It has been added to our reviews.', 'success');

        reviewForm.reset();
        document.getElementById('rating').value = '0';
        document.querySelectorAll('.star').forEach(s => {
            s.classList.remove('active');
            s.textContent = '☆';
            s.style.color = '#ddd';
        });
    });
}

function addReviewToCarousel(reviewData) {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;

    const newReview = createReviewCard(reviewData);
    slider.appendChild(newReview);
    slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' });
}

function createReviewCard(data) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.setAttribute('data-reveal', '');
    card.classList.add('is-visible');

    const stars = '⭐'.repeat(data.rating);

    card.innerHTML = `
        <div class="stars">${stars}</div>
        <p class="review-text">"${data.review}"</p>
        <div class="reviewer">
            <strong>${data.name}</strong>
            <span>${data.location}</span>
        </div>
    `;

    return card;
}

function storeReview(data) {
    let reviews = JSON.parse(localStorage.getItem('customerReviews') || '[]');
    reviews.push(data);
    localStorage.setItem('customerReviews', JSON.stringify(reviews));
}

window.getCustomerReviews = function() {
    return JSON.parse(localStorage.getItem('customerReviews') || '[]');
};

// Init all
window.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initContactForm();
    initNavbarShadow();
    initPhoneFormatting();
    initRevealAnimations();
    initReviewCarousel();
    initStarRating();
    initReviewForm();
});
