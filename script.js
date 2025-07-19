// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

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

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#ffffff';
        header.style.backdropFilter = 'none';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.scam-card, .tip-card, .feature');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Safety Check Tool
function checkSafety() {
    const input = document.getElementById('checkInput').value.trim();
    const resultDiv = document.getElementById('checkResult');
    
    if (!input) {
        showResult('Vui lòng nhập email, link hoặc số điện thoại cần kiểm tra.', 'warning');
        return;
    }

    // Simulate checking process
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
    resultDiv.className = 'check-result';

    setTimeout(() => {
        const result = analyzeInput(input);
        showResult(result.message, result.type);
    }, 2000);
}

function analyzeInput(input) {
    // Simple analysis logic (in real app, this would connect to backend)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlPattern = /^https?:\/\//;
    const phonePattern = /^[0-9+\-\s()]+$/;

    // Check for suspicious patterns
    const suspiciousKeywords = [
        'bank', 'paypal', 'account', 'verify', 'confirm', 'urgent',
        'prize', 'winner', 'lottery', 'inheritance', 'nigerian',
        'nganhang', 'tai khoan', 'xac nhan', 'cap nhat', 'khoa',
        'mo khoa', 'chuyen tien', 'trung thuong', 'giai thuong'
    ];

    const suspiciousDomains = [
        'fake-bank.com', 'scam-site.net', 'phishing-example.org',
        'malicious-link.com', 'fake-paypal.com'
    ];

    let riskLevel = 'safe';
    let message = '';

    // Check if it's an email
    if (emailPattern.test(input)) {
        const domain = input.split('@')[1];
        const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
            input.toLowerCase().includes(keyword)
        );
        const hasSuspiciousDomain = suspiciousDomains.some(suspicious => 
            domain.includes(suspicious)
        );

        if (hasSuspiciousKeywords || hasSuspiciousDomain) {
            riskLevel = 'danger';
            message = '⚠️ Email này có dấu hiệu lừa đảo! Không nên tin tưởng và không chia sẻ thông tin cá nhân.';
        } else {
            message = '✅ Email này có vẻ an toàn. Tuy nhiên, hãy luôn cảnh giác với các email không mong muốn.';
        }
    }
    // Check if it's a URL
    else if (urlPattern.test(input)) {
        const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
            input.toLowerCase().includes(keyword)
        );
        const hasSuspiciousDomain = suspiciousDomains.some(suspicious => 
            input.includes(suspicious)
        );

        if (hasSuspiciousKeywords || hasSuspiciousDomain) {
            riskLevel = 'danger';
            message = '⚠️ Link này có dấu hiệu lừa đảo! Không nên truy cập và không nhập thông tin cá nhân.';
        } else {
            message = '✅ Link này có vẻ an toàn. Tuy nhiên, hãy kiểm tra kỹ trước khi truy cập.';
        }
    }
    // Check if it's a phone number
    else if (phonePattern.test(input) && input.length >= 10) {
        const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
            input.toLowerCase().includes(keyword)
        );

        if (hasSuspiciousKeywords) {
            riskLevel = 'danger';
            message = '⚠️ Số điện thoại này có dấu hiệu lừa đảo! Không nên gọi lại hoặc chia sẻ thông tin.';
        } else {
            message = '✅ Số điện thoại này có vẻ an toàn. Tuy nhiên, hãy cảnh giác với các cuộc gọi lạ.';
        }
    }
    // General text analysis
    else {
        const hasSuspiciousKeywords = suspiciousKeywords.some(keyword => 
            input.toLowerCase().includes(keyword)
        );

        if (hasSuspiciousKeywords) {
            riskLevel = 'warning';
            message = '⚠️ Nội dung này có chứa từ khóa đáng ngờ. Hãy cẩn thận và kiểm tra kỹ trước khi tin tưởng.';
        } else {
            message = '✅ Nội dung này có vẻ an toàn. Tuy nhiên, hãy luôn cảnh giác với thông tin không rõ nguồn gốc.';
        }
    }

    return { message, type: riskLevel };
}

function showResult(message, type) {
    const resultDiv = document.getElementById('checkResult');
    resultDiv.style.display = 'block';
    resultDiv.className = `check-result ${type}`;
    resultDiv.innerHTML = message;
}

// Add click event for check button
document.addEventListener('DOMContentLoaded', () => {
    const checkButton = document.querySelector('.btn-primary');
    if (checkButton) {
        checkButton.addEventListener('click', checkSafety);
    }

    // Add enter key support for input
    const checkInput = document.getElementById('checkInput');
    if (checkInput) {
        checkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkSafety();
            }
        });
    }
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    
    updateCounter();
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent;
                const number = parseInt(text.replace(/[^\d]/g, ''));
                if (!isNaN(number)) {
                    animateCounter(stat, number);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe hero stats
document.addEventListener('DOMContentLoaded', () => {
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
});

// Add loading animation for buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('btn-primary') && this.textContent.includes('Kiểm tra')) {
                return; // Don't add loading for check button
            }
            
            // Add loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
            this.disabled = true;
            
            // Simulate loading
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 1500);
        });
    });
});

// Add tooltip functionality
function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            
            e.target.addEventListener('mouseleave', () => {
                tooltip.remove();
            });
        });
    });
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', addTooltips);

// Add scroll to top functionality
function addScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #2563eb;
        color: white;
        border: none;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.display = 'block';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });
    
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top
document.addEventListener('DOMContentLoaded', addScrollToTop); 