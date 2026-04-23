document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    const stickyCta = document.querySelector('.sticky-cta');

    mobileToggle.addEventListener('click', () => {
        nav.classList.toggle('mobile-open');
    });

    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
            nav.classList.remove('mobile-open');
        });
    });

    let scrolled = false;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrolled = true;
            if (stickyCta) {
                stickyCta.classList.add('visible');
            }
        } else {
            scrolled = false;
            if (stickyCta) {
                stickyCta.classList.remove('visible');
            }
        }
    });
});