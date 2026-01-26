// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form handling
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate phone number (basic validation)
    const phoneInput = document.getElementById('phone').value;
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneInput)) {
        showMessage('Please enter a valid phone number.', 'error');
        return;
    }
    
    // Validate email
    const emailInput = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(contactForm);
    
    // Submit to Formspree using AJAX
    fetch('https://formspree.io/f/mjgwglrw', {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showMessage('Thank you! Your message has been received. We\'ll contact you soon.', 'success');
            contactForm.reset();
        } else {
            return response.json().then(data => {
                if (data.errors) {
                    showMessage('There was a problem with your submission. Please try again.', 'error');
                } else {
                    showMessage('Oops! There was a problem submitting your form.', 'error');
                }
            });
        }
    })
    .catch(error => {
        showMessage('Sorry, there was an error. Please try again or contact us directly.', 'error');
        console.error('Error:', error);
    });
});

// Show message function
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 5000);
}

// Store form submission in localStorage
function storeFormSubmission(data) {
    let submissions = JSON.parse(localStorage.getItem('tailorSubmissions') || '[]');
    submissions.push(data);
    localStorage.setItem('tailorSubmissions', JSON.stringify(submissions));
}

// Retrieve all submissions (for demo/testing purposes)
function getSubmissions() {
    return JSON.parse(localStorage.getItem('tailorSubmissions') || '[]');
}

// Add to window object so you can check submissions in console
window.getFormSubmissions = getSubmissions;

// Add scroll effect to navbar
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
    
    lastScroll = currentScroll;
});

// Phone number formatting
const phoneInput = document.getElementById('phone');
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

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and pricing cards
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.service-card, .pricing-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Initialize review carousel
    initReviewCarousel();
    
    // Initialize star rating
    initStarRating();
    
    // Initialize review form
    initReviewForm();
});

// Review Carousel - Show 3 at a time, scroll 1 at a time
function initReviewCarousel() {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;
    
    const reviews = slider.querySelectorAll('.review-card');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (reviews.length === 0) return;
    
    const reviewsPerPage = 3;
    let currentIndex = 0;
    let autoScrollInterval;
    
    function showReviews(startIndex) {
        // Hide all reviews
        reviews.forEach(review => review.classList.remove('active'));
        
        // Show 3 reviews starting from startIndex
        for (let i = 0; i < reviewsPerPage; i++) {
            const index = (startIndex + i) % reviews.length;
            reviews[index].classList.add('active');
        }
    }
    
    // Show first 3 reviews
    showReviews(0);
    
    function nextReview() {
        currentIndex = (currentIndex + 1) % reviews.length; // Scroll 1 at a time
        showReviews(currentIndex);
    }
    
    function prevReview() {
        currentIndex = (currentIndex - 1 + reviews.length) % reviews.length; // Scroll 1 at a time
        showReviews(currentIndex);
    }
    
    // Button event listeners
    nextBtn.addEventListener('click', () => {
        nextReview();
        resetAutoScroll();
    });
    prevBtn.addEventListener('click', () => {
        prevReview();
        resetAutoScroll();
    });
    
    // Auto-advance carousel every 5 seconds
    function startAutoScroll() {
        autoScrollInterval = setInterval(nextReview, 5000);
    }
    
    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }
    
    startAutoScroll();
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevReview();
            resetAutoScroll();
        }
        if (e.key === 'ArrowRight') {
            nextReview();
            resetAutoScroll();
        }
    });
    
    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50; // Minimum distance for swipe
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - show next
                nextReview();
            } else {
                // Swiped right - show previous
                prevReview();
            }
            resetAutoScroll();
        }
    }
    
    // Return carousel object for dynamic updates
    return {
        addReview: function(reviewData) {
            const newReview = createReviewCard(reviewData);
            slider.appendChild(newReview);
            // Refresh reviews list
            const updatedReviews = slider.querySelectorAll('.review-card');
            reviews = updatedReviews;
        }
    };
}

// Create a review card element from data
function createReviewCard(data) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
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

// Star Rating System
function initStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.getAttribute('data-rating');
            ratingInput.value = rating;
            
            // Update star display
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
        
        // Hover effect
        star.addEventListener('mouseenter', function() {
            const rating = this.getAttribute('data-rating');
            stars.forEach(s => {
                const starRating = s.getAttribute('data-rating');
                if (starRating <= rating) {
                    s.style.color = 'var(--gold)';
                } else {
                    s.style.color = '#ddd';
                }
            });
        });
    });
    
    // Reset hover on mouse leave
    const starRating = document.querySelector('.star-rating');
    starRating.addEventListener('mouseleave', function() {
        const currentRating = ratingInput.value;
        stars.forEach(s => {
            const starRating = s.getAttribute('data-rating');
            if (starRating <= currentRating) {
                s.style.color = 'var(--gold)';
            } else {
                s.style.color = '#ddd';
            }
        });
    });
}

// Review Form Submission
function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewMessage = document.getElementById('reviewMessage');
    
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const rating = document.getElementById('rating').value;
        const name = document.getElementById('reviewerName').value;
        const location = document.getElementById('reviewerLocation').value;
        const reviewText = document.getElementById('reviewText').value;
        
        // Validate rating
        if (rating === '0') {
            showReviewMessage('Please select a star rating.', 'error');
            return;
        }
        
        // Create review data object
        const reviewData = {
            rating: parseInt(rating),
            name: name,
            location: location,
            review: reviewText,
            timestamp: new Date().toISOString()
        };
        
        // Store in localStorage (for demo)
        storeReview(reviewData);
        
        // Add review to carousel dynamically
        addReviewToCarousel(reviewData);
        
        // Show success message
        showReviewMessage('Thank you for your review! It has been added to our reviews.', 'success');
        
        // Reset form
        reviewForm.reset();
        document.getElementById('rating').value = '0';
        document.querySelectorAll('.star').forEach(s => {
            s.classList.remove('active');
            s.textContent = '☆';
            s.style.color = '#ddd';
        });
        
        console.log('Review submitted:', reviewData);
    });
}

// Add new review to carousel
function addReviewToCarousel(reviewData) {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;
    
    const newReview = createReviewCard(reviewData);
    slider.appendChild(newReview);
    
    console.log('New review added to carousel!');
}

function showReviewMessage(message, type) {
    const reviewMessage = document.getElementById('reviewMessage');
    reviewMessage.textContent = message;
    reviewMessage.className = `form-message ${type}`;
    reviewMessage.style.display = 'block';
    
    setTimeout(() => {
        reviewMessage.style.display = 'none';
    }, 5000);
}

function storeReview(data) {
    let reviews = JSON.parse(localStorage.getItem('customerReviews') || '[]');
    reviews.push(data);
    localStorage.setItem('customerReviews', JSON.stringify(reviews));
}

// Get all customer reviews
window.getCustomerReviews = function() {
    return JSON.parse(localStorage.getItem('customerReviews') || '[]');
};

console.log('🎉 Tailor website loaded successfully!');
console.log('💡 To view form submissions, type: getFormSubmissions() in the console');
