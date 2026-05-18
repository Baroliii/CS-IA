// Change navbar styling on scroll
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(10, 15, 18, 1)'; // Solid dark color
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
    } else {
        navbar.style.backgroundColor = 'rgba(10, 15, 18, 0.95)'; // Slightly transparent at top
        navbar.style.boxShadow = 'none';
    }
});

// Placeholder for mobile menu functionality
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    alert("Mobile menu functionality can be added here for your IA!");
});
