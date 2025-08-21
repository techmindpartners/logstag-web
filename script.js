// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
        
        if (!isClickInsideNav && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});

// Smooth Scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // Basic validation
            if (!name || !email || !message) {
                alert('Please fill in all fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Here you would typically send the data to a server
            // For now, we'll just show a success message
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            this.reset();
        });
    }
});

// Header scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    });
});

// Active navigation link highlighting
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function updateActiveLink() {
        let current = '';
        const headerHeight = document.querySelector('.header').offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink(); // Initial call
});

// Intersection Observer for animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const animatedElements = document.querySelectorAll('.about-card, .service-card, .hero-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // Services Flow Line Animation Observer
    const servicesSection = document.querySelector('.our-services');
    if (servicesSection) {
        const servicesObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-50px 0px -50px 0px'
        });

        servicesObserver.observe(servicesSection);
    }
});

// Team Testimonial Slider
document.addEventListener('DOMContentLoaded', function() {
    const testimonialData = [
        {
            title: "Meet Hakan, our Managing Partner & CEO. Leading the strategic vision and operations at Techmind Partners.",
            name: "HAKAN ARICI",
            role: "CEO",
            image: "assets/client-1.png"
        },
        {
            title: "Meet Sarah, our CTO. Driving innovation and technical excellence in all our technology solutions.",
            name: "SARAH JOHNSON",
            role: "CTO",
            image: "assets/client-2.jpg"
        },
        {
            title: "Meet Marc, our Head of Business Development. Building strategic partnerships for sustainable growth.",
            name: "MARC TATLISU",
            role: "Head of Business Development",
            image: "assets/client-3.png"
        }
    ];
    
    let currentTestimonial = 0;
    
    const testimonialTitle = document.querySelector('.testimonial-title');
    const testimonialName = document.querySelector('.testimonial-name');
    const testimonialRole = document.querySelector('.testimonial-role');
    const testimonialImg = document.querySelector('.testimonial-img');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    
    if (testimonialTitle && testimonialName && testimonialRole && testimonialImg && prevBtn && nextBtn) {
        function updateTestimonial() {
            const data = testimonialData[currentTestimonial];
            
            // Add fade out effect
            const testimonialContent = document.querySelector('.testimonial-content');
            testimonialContent.style.opacity = '0.7';
            
            setTimeout(() => {
                testimonialTitle.textContent = data.title;
                testimonialName.textContent = data.name;
                testimonialRole.textContent = data.role;
                testimonialImg.src = data.image;
                testimonialImg.alt = data.name;
                
                // Fade back in
                testimonialContent.style.opacity = '1';
            }, 200);
        }
        
        function nextTestimonial() {
            currentTestimonial = (currentTestimonial + 1) % testimonialData.length;
            updateTestimonial();
        }
        
        function prevTestimonial() {
            currentTestimonial = (currentTestimonial - 1 + testimonialData.length) % testimonialData.length;
            updateTestimonial();
        }
        
        // Event listeners
        nextBtn.addEventListener('click', nextTestimonial);
        prevBtn.addEventListener('click', prevTestimonial);
        
        // Auto-advance testimonials every 8 seconds
        setInterval(nextTestimonial, 8000);
        
        // Add smooth transition
        const testimonialContent = document.querySelector('.testimonial-content');
        if (testimonialContent) {
            testimonialContent.style.transition = 'opacity 0.3s ease';
        }
    }
});

// Success Stories Testimonials Slider
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.testimonials-slider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (slider && prevBtn && nextBtn) {
        const cardWidth = 332; // 300px card + 32px gap
        let currentPosition = 0;
        const maxCards = document.querySelectorAll('.testimonial-card').length;
        const visibleCards = Math.floor(slider.offsetWidth / cardWidth);
        const maxPosition = Math.max(0, (maxCards - visibleCards) * cardWidth);
        
        function updateButtonStates() {
            prevBtn.disabled = currentPosition <= 0;
            nextBtn.disabled = currentPosition >= maxPosition;
        }
        
        function slideNext() {
            if (currentPosition < maxPosition) {
                currentPosition += cardWidth;
                slider.scrollTo({
                    left: currentPosition,
                    behavior: 'smooth'
                });
            }
            updateButtonStates();
        }
        
        function slidePrev() {
            if (currentPosition > 0) {
                currentPosition -= cardWidth;
                slider.scrollTo({
                    left: currentPosition,
                    behavior: 'smooth'
                });
            }
            updateButtonStates();
        }
        
        // Event listeners
        nextBtn.addEventListener('click', slideNext);
        prevBtn.addEventListener('click', slidePrev);
        
        // Handle scroll events to update current position
        slider.addEventListener('scroll', function() {
            currentPosition = slider.scrollLeft;
            updateButtonStates();
        });
        
        // Initialize button states
        updateButtonStates();
        
        // Handle window resize
        window.addEventListener('resize', function() {
            const newVisibleCards = Math.floor(slider.offsetWidth / cardWidth);
            const newMaxPosition = Math.max(0, (maxCards - newVisibleCards) * cardWidth);
            
            if (currentPosition > newMaxPosition) {
                currentPosition = newMaxPosition;
                slider.scrollTo({
                    left: currentPosition,
                    behavior: 'smooth'
                });
            }
            updateButtonStates();
        });
    }
});

