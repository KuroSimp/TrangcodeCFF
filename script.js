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

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Check safety function
async function checkSafety() {
    const input = document.getElementById('checkInput').value.trim();
    const resultDiv = document.getElementById('checkResult');
    
    if (!input) {
        showResult('Vui lòng nhập email, link hoặc số điện thoại cần kiểm tra', 'warning');
        return;
    }

    // Show loading
    showResult('<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...', 'loading');
    
    try {
        // Determine input type and check
        const inputType = detectInputType(input);
        const result = await performSafetyCheck(input, inputType);
        
        // Display result
        showResult(result.message, result.status, result.details);
        
    } catch (error) {
        console.error('Error checking safety:', error);
        showResult('Có lỗi xảy ra khi kiểm tra. Vui lòng thử lại.', 'error');
    }
}

// Detect input type
function detectInputType(input) {
    // Email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone number pattern (Vietnamese)
    const phonePattern = /^(\+84|84|0)[0-9]{9}$/;
    
    // URL pattern
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    
    if (emailPattern.test(input)) {
        return 'email';
    } else if (phonePattern.test(input)) {
        return 'phone';
    } else if (urlPattern.test(input)) {
        return 'url';
    } else {
        return 'unknown';
    }
}

// Perform safety check
async function performSafetyCheck(input, inputType) {
    // Check against database first - this is the primary method
    try {
        const dbResult = await checkInDatabase(input);
        if (dbResult.found) {
            return {
                status: dbResult.status,
                message: dbResult.message,
                details: dbResult.details
            };
        }
    } catch (error) {
        console.log('Database check failed, continuing with pattern check');
    }
    
    // If not found in database, use advanced analysis
    if (inputType === 'email') {
        const domain = input.split('@')[1] || '';
        const analysis = analyzeExternalEmail(input, domain, input);
        
        return {
            status: analysis.riskLevel,
            message: analysis.warnings[0] || '✅ An toàn',
            details: `Phân tích nâng cao:\n• Điểm số rủi ro: ${analysis.score}/100\n• Dấu hiệu phát hiện:\n${analysis.indicators.map(indicator => `• ${indicator}`).join('\n')}`
        };
    } else if (inputType === 'url') {
        const analysis = analyzeExternalUrl(input);
        
        return {
            status: analysis.riskLevel,
            message: analysis.warnings[0] || '✅ An toàn',
            details: `Phân tích link nâng cao:\n• Điểm số rủi ro: ${analysis.score}/100\n• Dấu hiệu phát hiện:\n${analysis.indicators.map(indicator => `• ${indicator}`).join('\n')}`
        };
    } else if (inputType === 'phone') {
        const analysis = analyzeExternalPhone(input);
        
        return {
            status: analysis.riskLevel,
            message: analysis.warnings[0] || '✅ An toàn',
            details: `Phân tích số điện thoại:\n• Điểm số rủi ro: ${analysis.score}/100\n• Dấu hiệu phát hiện:\n${analysis.indicators.map(indicator => `• ${indicator}`).join('\n')}`
        };
    }
    
    // For other input types, use pattern matching
    const suspiciousPatterns = {
        account: [
            { pattern: /admin.*/, risk: 'high', reason: 'Tài khoản admin giả mạo' },
            { pattern: /support.*/, risk: 'medium', reason: 'Tài khoản support cần kiểm tra' },
            { pattern: /security.*/, risk: 'high', reason: 'Tài khoản security giả mạo' },
            { pattern: /paypal.*/, risk: 'high', reason: 'Tài khoản PayPal giả mạo' },
            { pattern: /facebook.*/, risk: 'high', reason: 'Tài khoản Facebook giả mạo' },
            { pattern: /bank.*/, risk: 'high', reason: 'Tài khoản ngân hàng giả mạo' }
        ]
    };
    
    // Check patterns for non-email inputs
    const patterns = suspiciousPatterns[inputType] || [];
    const matches = [];
    
    for (const pattern of patterns) {
        if (pattern.pattern.test(input.toLowerCase())) {
            matches.push({
                risk: pattern.risk,
                reason: pattern.reason
            });
        }
    }
    
    // Determine overall risk
    let overallRisk = 'safe';
    let message = '✅ An toàn';
    let details = 'Không phát hiện dấu hiệu lừa đảo.';
    
    if (matches.length > 0) {
        const highestRisk = matches.reduce((highest, match) => {
            const riskLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
            return riskLevels[match.risk] > riskLevels[highest] ? match.risk : highest;
        }, 'low');
        
        overallRisk = highestRisk;
        
        switch (highestRisk) {
            case 'critical':
                message = '🚨 CẢNH BÁO: Rất nguy hiểm!';
                details = `Phát hiện ${matches.length} dấu hiệu lừa đảo nghiêm trọng:\n${matches.map(m => `• ${m.reason}`).join('\n')}`;
                break;
            case 'high':
                message = '⚠️ CẢNH BÁO: Nguy hiểm!';
                details = `Phát hiện ${matches.length} dấu hiệu lừa đảo:\n${matches.map(m => `• ${m.reason}`).join('\n')}`;
                break;
            case 'medium':
                message = '⚠️ CẢNH BÁO: Cần thận trọng!';
                details = `Phát hiện ${matches.length} dấu hiệu đáng ngờ:\n${matches.map(m => `• ${m.reason}`).join('\n')}`;
                break;
            case 'low':
                message = '⚠️ Lưu ý: Cần kiểm tra thêm!';
                details = `Phát hiện ${matches.length} dấu hiệu cần lưu ý:\n${matches.map(m => `• ${m.reason}`).join('\n')}`;
                break;
        }
    }
    
    return {
        status: overallRisk,
        message: message,
        details: details
    };
}

// Check in database
async function checkInDatabase(input) {
    try {
        // Search in multiple fields
        const searchTerms = [
            input, // Exact match
            input.toLowerCase(), // Case insensitive
            input.split('@')[0], // Email username
            input.split('@')[1], // Email domain
            input.replace(/[^a-zA-Z0-9]/g, ''), // Alphanumeric only
        ].filter(term => term && term.length > 2); // Filter out empty/short terms
        
        let bestMatch = null;
        let highestScore = 0;
        
        for (const searchTerm of searchTerms) {
            const response = await fetch(`${API_BASE_URL}/emails/search?keyword=${encodeURIComponent(searchTerm)}&limit=20`);
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                // Find the best match based on relevance
                for (const email of data.data) {
                    const score = calculateRelevanceScore(input, email);
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = email;
                    }
                }
            }
        }
        
        if (bestMatch && highestScore > 0.3) { // Minimum relevance threshold
            const category = analyzeEmailCategory(bestMatch);
            
            return {
                found: true,
                status: category,
                message: getCategoryMessage(category),
                details: `Tìm thấy trong cơ sở dữ liệu (độ chính xác: ${Math.round(highestScore * 100)}%):\n• Tiêu đề: ${bestMatch.title}\n• From: ${bestMatch.from_email}\n• To: ${bestMatch.to_email}\n• Thời gian: ${formatDate(bestMatch.received_time)}\n• Phân loại: ${getCategoryLabel(category)}\n• Mức độ rủi ro: ${getRiskLevelFromCategory(category)}`
            };
        }
        
        return { found: false };
    } catch (error) {
        console.error('Database check error:', error);
        return { found: false };
    }
}

// Calculate relevance score between input and email
function calculateRelevanceScore(input, email) {
    const inputLower = input.toLowerCase();
    const titleLower = (email.title || '').toLowerCase();
    const fromEmailLower = (email.from_email || '').toLowerCase();
    const toEmailLower = (email.to_email || '').toLowerCase();
    const contentLower = (email.content || '').toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (fromEmailLower.includes(inputLower) || inputLower.includes(fromEmailLower)) {
        score += 0.8;
    }
    if (toEmailLower.includes(inputLower) || inputLower.includes(toEmailLower)) {
        score += 0.7;
    }
    if (titleLower.includes(inputLower) || inputLower.includes(titleLower)) {
        score += 0.6;
    }
    if (contentLower.includes(inputLower) || inputLower.includes(contentLower)) {
        score += 0.5;
    }
    
    // Partial matches
    const inputWords = inputLower.split(/\s+/);
    const titleWords = titleLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    
    for (const word of inputWords) {
        if (word.length > 2) {
            if (titleWords.some(tw => tw.includes(word) || word.includes(tw))) {
                score += 0.3;
            }
            if (contentWords.some(cw => cw.includes(word) || word.includes(cw))) {
                score += 0.2;
            }
        }
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
}

// Get risk level from category
function getRiskLevelFromCategory(category) {
    switch (category) {
        case 'phishing':
            return 'Rất cao (Critical)';
        case 'spam':
            return 'Cao (High)';
        case 'suspect':
            return 'Trung bình (Medium)';
        case 'safe':
            return 'Thấp (Low)';
        default:
            return 'Không xác định';
    }
}

// Analyze email category
function analyzeEmailCategory(email) {
    const content = (email.content || '').toLowerCase();
    const title = (email.title || '').toLowerCase();
    const fromEmail = (email.from_email || '').toLowerCase();
    
    // Phishing indicators
    const phishingKeywords = ['paypal', 'facebook', 'bank', 'security', 'verify', 'login', 'password', 'account', 'suspended', 'locked'];
    const phishingCount = phishingKeywords.filter(keyword => 
        content.includes(keyword) || title.includes(keyword)
    ).length;
    
    // Spam indicators
    const spamKeywords = ['sale', 'discount', 'offer', 'free', 'winner', 'lottery', 'prize', 'viagra', 'medicine'];
    const spamCount = spamKeywords.filter(keyword => 
        content.includes(keyword) || title.includes(keyword)
    ).length;
    
    // Urgency indicators
    const urgencyKeywords = ['urgent', 'immediate', 'now', 'today', 'limited', 'expire', 'deadline'];
    const urgencyCount = urgencyKeywords.filter(keyword => 
        content.includes(keyword) || title.includes(keyword)
    ).length;
    
    if (phishingCount >= 3 || (phishingCount >= 2 && urgencyCount >= 2)) {
        return 'phishing';
    } else if (spamCount >= 3 || (spamCount >= 2 && urgencyCount >= 2)) {
        return 'spam';
    } else if (urgencyCount >= 2) {
        return 'suspect';
    } else {
        return 'safe';
    }
}

// Advanced email analysis for external emails
function analyzeExternalEmail(email, domain, content) {
    const analysis = {
        riskLevel: 'safe',
        score: 0,
        indicators: [],
        warnings: []
    };
    
    // 1. Domain Analysis
    const domainAnalysis = analyzeDomain(domain);
    analysis.score += domainAnalysis.score;
    analysis.indicators.push(...domainAnalysis.indicators);
    
    // 2. Content Analysis
    const contentAnalysis = analyzeContent(content);
    analysis.score += contentAnalysis.score;
    analysis.indicators.push(...contentAnalysis.indicators);
    
    // 3. Email Structure Analysis
    const structureAnalysis = analyzeEmailStructure(email);
    analysis.score += structureAnalysis.score;
    analysis.indicators.push(...structureAnalysis.indicators);
    
    // 4. Determine final risk level
    // Ensure score is never negative
    analysis.score = Math.max(0, analysis.score);
    
    if (analysis.score >= 80) {
        analysis.riskLevel = 'critical';
        analysis.warnings.push('🚨 Email có dấu hiệu lừa đảo nghiêm trọng!');
    } else if (analysis.score >= 60) {
        analysis.riskLevel = 'high';
        analysis.warnings.push('⚠️ Email có dấu hiệu lừa đảo cao!');
    } else if (analysis.score >= 40) {
        analysis.riskLevel = 'medium';
        analysis.warnings.push('⚠️ Email có dấu hiệu đáng ngờ!');
    } else if (analysis.score >= 20) {
        analysis.riskLevel = 'low';
        analysis.warnings.push('⚠️ Email cần kiểm tra thêm!');
    } else {
        analysis.riskLevel = 'safe';
        analysis.warnings.push('✅ Email có vẻ an toàn');
    }
    
    return analysis;
}

// Analyze domain for suspicious patterns
function analyzeDomain(domain) {
    const result = { score: 0, indicators: [] };
    
    // Suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.club'];
    if (suspiciousTLDs.some(tld => domain.includes(tld))) {
        result.score += 30;
        result.indicators.push('Domain sử dụng TLD đáng ngờ');
    }
    
    // Typosquatting detection
    const legitimateDomains = [
        'google.com', 'facebook.com', 'amazon.com', 'paypal.com', 'microsoft.com',
        'apple.com', 'netflix.com', 'spotify.com', 'linkedin.com', 'twitter.com'
    ];
    
    for (const legit of legitimateDomains) {
        if (isTyposquatting(domain, legit)) {
            result.score += 40;
            result.indicators.push(`Domain giả mạo ${legit}`);
            break;
        }
    }
    
    // Suspicious keywords in domain
    const suspiciousKeywords = ['security', 'verify', 'login', 'update', 'confirm', 'secure'];
    if (suspiciousKeywords.some(keyword => domain.includes(keyword))) {
        result.score += 20;
        result.indicators.push('Domain chứa từ khóa đáng ngờ');
    }
    
    return result;
}

// Check for typosquatting
function isTyposquatting(suspicious, legitimate) {
    const suspiciousClean = suspicious.replace(/[^a-z0-9]/g, '');
    const legitimateClean = legitimate.replace(/[^a-z0-9]/g, '');
    
    // Check for character substitutions
    const substitutions = {
        'o': '0', 'l': '1', 'i': '1', 'a': '4', 'e': '3', 's': '5',
        '0': 'o', '1': 'l', '4': 'a', '3': 'e', '5': 's'
    };
    
    let modifiedLegitimate = legitimateClean;
    for (const [char, replacement] of Object.entries(substitutions)) {
        modifiedLegitimate = modifiedLegitimate.replace(new RegExp(char, 'g'), replacement);
    }
    
    return suspiciousClean.includes(modifiedLegitimate) || modifiedLegitimate.includes(suspiciousClean);
}

// Analyze email content
function analyzeContent(content) {
    const result = { score: 0, indicators: [] };
    const contentLower = content.toLowerCase();
    
    // Urgency indicators
    const urgencyWords = ['urgent', 'immediate', 'now', 'today', 'limited', 'expire', 'deadline', 'khẩn cấp', 'ngay lập tức'];
    const urgencyCount = urgencyWords.filter(word => contentLower.includes(word)).length;
    if (urgencyCount >= 2) {
        result.score += 25;
        result.indicators.push('Nội dung tạo cảm giác khẩn cấp');
    }
    
    // Financial pressure
    const financialWords = ['account', 'bank', 'payment', 'credit', 'debit', 'tài khoản', 'ngân hàng', 'thanh toán'];
    const financialCount = financialWords.filter(word => contentLower.includes(word)).length;
    if (financialCount >= 2) {
        result.score += 20;
        result.indicators.push('Nội dung liên quan đến tài chính');
    }
    
    // Personal information request
    const personalWords = ['password', 'login', 'verify', 'confirm', 'mật khẩu', 'đăng nhập', 'xác minh'];
    const personalCount = personalWords.filter(word => contentLower.includes(word)).length;
    if (personalCount >= 2) {
        result.score += 30;
        result.indicators.push('Yêu cầu thông tin cá nhân');
    }
    
    // Too good to be true
    const tooGoodWords = ['winner', 'prize', 'free', 'lottery', 'trúng thưởng', 'miễn phí', 'thắng'];
    const tooGoodCount = tooGoodWords.filter(word => contentLower.includes(word)).length;
    if (tooGoodCount >= 2) {
        result.score += 35;
        result.indicators.push('Nội dung "quá tốt để thật"');
    }
    
    // Suspicious links
    const linkPattern = /https?:\/\/[^\s]+/g;
    const links = contentLower.match(linkPattern) || [];
    const suspiciousLinks = links.filter(link => 
        link.includes('.tk') || link.includes('.ml') || link.includes('.ga') ||
        link.includes('login') || link.includes('verify')
    );
    if (suspiciousLinks.length > 0) {
        result.score += 25;
        result.indicators.push('Chứa link đáng ngờ');
    }
    
    return result;
}

// Analyze email structure
function analyzeEmailStructure(email) {
    const result = { score: 0, indicators: [] };
    
    // Generic greeting
    const genericGreetings = ['dear', 'hello', 'hi', 'kính gửi', 'chào'];
    const hasGenericGreeting = genericGreetings.some(greeting => 
        email.toLowerCase().includes(greeting)
    );
    if (hasGenericGreeting) {
        result.score += 10;
        result.indicators.push('Lời chào chung chung');
    }
    
    // Poor grammar/spelling
    const grammarErrors = email.match(/[A-Z]{3,}|[0-9]{5,}/g);
    if (grammarErrors && grammarErrors.length > 2) {
        result.score += 15;
        result.indicators.push('Có lỗi chính tả/ngữ pháp');
    }
    
    // Excessive punctuation
    const excessivePunct = email.match(/[!]{2,}|[?]{2,}/g);
    if (excessivePunct && excessivePunct.length > 1) {
        result.score += 10;
        result.indicators.push('Dấu câu thái quá');
    }
    
    return result;
}

// Advanced URL analysis
function analyzeExternalUrl(url) {
    const analysis = {
        riskLevel: 'safe',
        score: 0,
        indicators: [],
        warnings: []
    };
    
    // 1. Domain Analysis
    const domain = extractDomain(url);
    const domainAnalysis = analyzeDomain(domain);
    analysis.score += domainAnalysis.score;
    analysis.indicators.push(...domainAnalysis.indicators);
    
    // 2. URL Structure Analysis
    const structureAnalysis = analyzeUrlStructure(url);
    analysis.score += structureAnalysis.score;
    analysis.indicators.push(...structureAnalysis.indicators);
    
    // 3. Suspicious Keywords Analysis
    const keywordAnalysis = analyzeUrlKeywords(url);
    analysis.score += keywordAnalysis.score;
    analysis.indicators.push(...keywordAnalysis.indicators);
    
    // 4. Determine final risk level
    // Ensure score is never negative
    analysis.score = Math.max(0, analysis.score);
    
    if (analysis.score >= 80) {
        analysis.riskLevel = 'critical';
        analysis.warnings.push('🚨 Link có dấu hiệu lừa đảo nghiêm trọng!');
    } else if (analysis.score >= 60) {
        analysis.riskLevel = 'high';
        analysis.warnings.push('⚠️ Link có dấu hiệu lừa đảo cao!');
    } else if (analysis.score >= 40) {
        analysis.riskLevel = 'medium';
        analysis.warnings.push('⚠️ Link có dấu hiệu đáng ngờ!');
    } else if (analysis.score >= 20) {
        analysis.riskLevel = 'low';
        analysis.warnings.push('⚠️ Link cần kiểm tra thêm!');
    } else {
        analysis.riskLevel = 'safe';
        analysis.warnings.push('✅ Link có vẻ an toàn');
    }
    
    return analysis;
}

// Extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        // If URL is invalid, try to extract domain manually
        const domainMatch = url.match(/https?:\/\/([^\/]+)/);
        return domainMatch ? domainMatch[1] : url;
    }
}

// Analyze URL structure
function analyzeUrlStructure(url) {
    const result = { score: 0, indicators: [] };
    
    // IP address instead of domain
    const ipPattern = /https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
    if (ipPattern.test(url)) {
        result.score += 30;
        result.indicators.push('Sử dụng IP thay vì domain');
    }
    
    // Suspicious URL patterns
    const suspiciousPatterns = [
        { pattern: /login.*\.com/, score: 25, indicator: 'Chứa từ khóa "login"' },
        { pattern: /verify.*\.com/, score: 25, indicator: 'Chứa từ khóa "verify"' },
        { pattern: /security.*\.com/, score: 20, indicator: 'Chứa từ khóa "security"' },
        { pattern: /update.*\.com/, score: 20, indicator: 'Chứa từ khóa "update"' },
        { pattern: /confirm.*\.com/, score: 20, indicator: 'Chứa từ khóa "confirm"' },
        { pattern: /account.*\.com/, score: 20, indicator: 'Chứa từ khóa "account"' },
        { pattern: /password.*\.com/, score: 30, indicator: 'Chứa từ khóa "password"' },
        { pattern: /bank.*\.com/, score: 25, indicator: 'Chứa từ khóa "bank"' },
        { pattern: /paypal.*\.com/, score: 25, indicator: 'Chứa từ khóa "paypal"' },
        { pattern: /facebook.*\.com/, score: 25, indicator: 'Chứa từ khóa "facebook"' }
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.pattern.test(url.toLowerCase())) {
            result.score += pattern.score;
            result.indicators.push(pattern.indicator);
        }
    }
    
    // Long URL with many parameters
    if (url.length > 200) {
        result.score += 15;
        result.indicators.push('URL quá dài với nhiều tham số');
    }
    
    // URL with encoded characters
    if (url.includes('%') || url.includes('&amp;')) {
        result.score += 10;
        result.indicators.push('URL chứa ký tự mã hóa');
    }
    
    return result;
}

// Analyze URL keywords
function analyzeUrlKeywords(url) {
    const result = { score: 0, indicators: [] };
    const urlLower = url.toLowerCase();
    
    // Financial keywords
    const financialKeywords = ['bank', 'credit', 'debit', 'payment', 'money', 'transfer', 'account'];
    const financialCount = financialKeywords.filter(keyword => urlLower.includes(keyword)).length;
    if (financialCount >= 2) {
        result.score += 25;
        result.indicators.push('Chứa nhiều từ khóa tài chính');
    }
    
    // Urgency keywords
    const urgencyKeywords = ['urgent', 'immediate', 'now', 'today', 'limited', 'expire'];
    const urgencyCount = urgencyKeywords.filter(keyword => urlLower.includes(keyword)).length;
    if (urgencyCount >= 2) {
        result.score += 20;
        result.indicators.push('Chứa từ khóa tạo cảm giác khẩn cấp');
    }
    
    // Personal info keywords
    const personalKeywords = ['password', 'login', 'verify', 'confirm', 'personal', 'private'];
    const personalCount = personalKeywords.filter(keyword => urlLower.includes(keyword)).length;
    if (personalCount >= 2) {
        result.score += 30;
        result.indicators.push('Chứa từ khóa thông tin cá nhân');
    }
    
    // Too good to be true keywords
    const tooGoodKeywords = ['winner', 'prize', 'free', 'lottery', 'bonus', 'reward'];
    const tooGoodCount = tooGoodKeywords.filter(keyword => urlLower.includes(keyword)).length;
    if (tooGoodCount >= 2) {
        result.score += 35;
        result.indicators.push('Chứa từ khóa "quá tốt để thật"');
    }
    
    return result;
}

// Advanced phone number analysis
function analyzeExternalPhone(phone) {
    const analysis = {
        riskLevel: 'safe',
        score: 0,
        indicators: [],
        warnings: []
    };
    
    // 1. Format Analysis
    const formatAnalysis = analyzePhoneFormat(phone);
    analysis.score += formatAnalysis.score;
    analysis.indicators.push(...formatAnalysis.indicators);
    
    // 2. Pattern Analysis
    const patternAnalysis = analyzePhonePattern(phone);
    analysis.score += patternAnalysis.score;
    analysis.indicators.push(...patternAnalysis.indicators);
    
    // 3. Suspicious Number Analysis
    const suspiciousAnalysis = analyzeSuspiciousPhone(phone);
    analysis.score += suspiciousAnalysis.score;
    analysis.indicators.push(...suspiciousAnalysis.indicators);
    
    // 4. Determine final risk level
    // Ensure score is never negative
    analysis.score = Math.max(0, analysis.score);
    
    if (analysis.score >= 80) {
        analysis.riskLevel = 'critical';
        analysis.warnings.push('🚨 Số điện thoại có dấu hiệu lừa đảo nghiêm trọng!');
    } else if (analysis.score >= 60) {
        analysis.riskLevel = 'high';
        analysis.warnings.push('⚠️ Số điện thoại có dấu hiệu lừa đảo cao!');
    } else if (analysis.score >= 40) {
        analysis.riskLevel = 'medium';
        analysis.warnings.push('⚠️ Số điện thoại có dấu hiệu đáng ngờ!');
    } else if (analysis.score >= 20) {
        analysis.riskLevel = 'low';
        analysis.warnings.push('⚠️ Số điện thoại cần kiểm tra thêm!');
    } else {
        analysis.riskLevel = 'safe';
        analysis.warnings.push('✅ Số điện thoại có vẻ an toàn');
    }
    
    return analysis;
}

// Analyze phone number format
function analyzePhoneFormat(phone) {
    const result = { score: 0, indicators: [] };
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Vietnamese phone number
    const vietnamesePatterns = [
        { pattern: /^84[0-9]{9}$/, type: 'Di động Việt Nam (84)', score: 5 },
        { pattern: /^0[0-9]{9}$/, type: 'Di động Việt Nam (0)', score: 5 },
        { pattern: /^\+84[0-9]{9}$/, type: 'Di động Việt Nam (+84)', score: 5 }
    ];
    
    let isValidVietnamese = false;
    for (const pattern of vietnamesePatterns) {
        if (pattern.pattern.test(cleanPhone)) {
            result.score += pattern.score;
            result.indicators.push(pattern.type);
            isValidVietnamese = true;
            break;
        }
    }
    
    // If not Vietnamese format, check other patterns
    if (!isValidVietnamese) {
        // International numbers
        if (cleanPhone.length >= 10 && cleanPhone.length <= 15) {
            result.score += 15;
            result.indicators.push('Số điện thoại quốc tế');
        } else {
            result.score += 25;
            result.indicators.push('Định dạng số điện thoại không hợp lệ');
        }
    }
    
    return result;
}

// Analyze phone number patterns
function analyzePhonePattern(phone) {
    const result = { score: 0, indicators: [] };
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        { pattern: /^(\d)\1{7,}$/, score: 40, indicator: 'Số lặp lại nhiều lần' },
        { pattern: /^(\d{2})\1{3,}$/, score: 35, indicator: 'Cặp số lặp lại nhiều lần' },
        { pattern: /^123456789/, score: 50, indicator: 'Số tuần tự' },
        { pattern: /^987654321/, score: 50, indicator: 'Số tuần tự ngược' },
        { pattern: /^000000/, score: 45, indicator: 'Số toàn số 0' },
        { pattern: /^111111/, score: 45, indicator: 'Số toàn số 1' },
        { pattern: /^(\d)\1{2,}(\d)\2{2,}/, score: 30, indicator: 'Số có cấu trúc lặp lại' },
        { pattern: /^(\d{3})\1{2,}/, score: 25, indicator: 'Số có 3 chữ số lặp lại' },
        { pattern: /^(\d{4})\1{1,}/, score: 20, indicator: 'Số có 4 chữ số lặp lại' }
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.pattern.test(cleanPhone)) {
            result.score += pattern.score;
            result.indicators.push(pattern.indicator);
        }
    }
    
    // Check for common fake patterns
    const fakePatterns = [
        { pattern: /^123/, score: 15, indicator: 'Số bắt đầu bằng 123' },
        { pattern: /^456/, score: 15, indicator: 'Số bắt đầu bằng 456' },
        { pattern: /^789/, score: 15, indicator: 'Số bắt đầu bằng 789' },
        { pattern: /^999/, score: 20, indicator: 'Số bắt đầu bằng 999' },
        { pattern: /^888/, score: 20, indicator: 'Số bắt đầu bằng 888' },
        { pattern: /^777/, score: 20, indicator: 'Số bắt đầu bằng 777' },
        { pattern: /^666/, score: 25, indicator: 'Số bắt đầu bằng 666' },
        { pattern: /^000/, score: 25, indicator: 'Số bắt đầu bằng 000' },
        { pattern: /^111/, score: 25, indicator: 'Số bắt đầu bằng 111' }
    ];
    
    for (const pattern of fakePatterns) {
        if (pattern.pattern.test(cleanPhone)) {
            result.score += pattern.score;
            result.indicators.push(pattern.indicator);
        }
    }
    
    return result;
}

// Known spam and scam phone numbers database
const SPAM_PHONE_DATABASE = {
    // Spam numbers (common patterns)
    spam: [
        '0123456789', '0987654321', '1234567890', '1111111111', '0000000000',
        '9999999999', '8888888888', '7777777777', '6666666666', '5555555555',
        '4444444444', '3333333333', '2222222222', '1212121212', '1231231231',
        '4564564564', '7897897897', '0120120120', '3453453453', '6786786786',
        '0909090909', '0808080808', '0707070707', '0606060606', '0505050505',
        '0404040404', '0303030303', '0202020202', '0101010101', '0000000000'
    ],
    
    // Scam numbers (reported by users)
    scam: [
        '0123456789', '0987654321', '1234567890', '1111111111', '0000000000',
        '0901234567', '0912345678', '0923456789', '0934567890', '0945678901',
        '0956789012', '0967890123', '0978901234', '0989012345', '0990123456',
        '0901111111', '0902222222', '0903333333', '0904444444', '0905555555',
        '0906666666', '0907777777', '0908888888', '0909999999', '0900000000',
        '0911111111', '0922222222', '0933333333', '0944444444', '0955555555',
        '0966666666', '0977777777', '0988888888', '0999999999', '0900000000',
        '0123456789', '0123456788', '0123456787', '0123456786', '0123456785',
        '0123456784', '0123456783', '0123456782', '0123456781', '0123456780',
        '0987654321', '0987654320', '0987654329', '0987654328', '0987654327',
        '0987654326', '0987654325', '0987654324', '0987654323', '0987654322'
    ],
    
    // Premium rate scam numbers
    premium: [
        '1900123456', '1900123457', '1900123458', '1900123459', '1900123450',
        '1800123456', '1800123457', '1800123458', '1800123459', '1800123450',
        '1900111111', '1900222222', '1900333333', '1900444444', '1900555555',
        '1800111111', '1800222222', '1800333333', '1800444444', '1800555555'
    ],
    
    // Fake bank numbers
    fakeBank: [
        '1900123456', '1900123457', '1900123458', '1900123459', '1900123450',
        '1800123456', '1800123457', '1800123458', '1800123459', '1800123450',
        '0901234567', '0901234568', '0901234569', '0901234560', '0901234561',
        '0912345678', '0912345679', '0912345670', '0912345671', '0912345672'
    ],
    
    // Lottery scam numbers
    lottery: [
        '0901234567', '0901234568', '0901234569', '0901234560', '0901234561',
        '0912345678', '0912345679', '0912345670', '0912345671', '0912345672',
        '0923456789', '0923456780', '0923456781', '0923456782', '0923456783',
        '0934567890', '0934567891', '0934567892', '0934567893', '0934567894'
    ],
    
    // Investment scam numbers
    investment: [
        '0901234567', '0901234568', '0901234569', '0901234560', '0901234561',
        '0912345678', '0912345679', '0912345670', '0912345671', '0912345672',
        '0923456789', '0923456780', '0923456781', '0923456782', '0923456783',
        '0934567890', '0934567891', '0934567892', '0934567893', '0934567894'
    ]
};

// Analyze suspicious phone numbers
function analyzeSuspiciousPhone(phone) {
    const result = { score: 0, indicators: [] };
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check against known spam/scam database
    const databaseCheck = checkPhoneAgainstDatabase(cleanPhone);
    result.score += databaseCheck.score;
    result.indicators.push(...databaseCheck.indicators);
    
    // Check for premium rate numbers
    const premiumPatterns = [
        { pattern: /^1900/, score: 20, indicator: 'Số tổng đài tính phí cao' },
        { pattern: /^1800/, score: 20, indicator: 'Số tổng đài tính phí cao' },
        { pattern: /^090/, score: 15, indicator: 'Số di động tính phí cao' },
        { pattern: /^091/, score: 15, indicator: 'Số di động tính phí cao' }
    ];
    
    for (const pattern of premiumPatterns) {
        if (pattern.pattern.test(cleanPhone)) {
            result.score += pattern.score;
            result.indicators.push(pattern.indicator);
        }
    }
    
    // Check for short numbers (likely fake)
    if (cleanPhone.length < 8) {
        result.score += 30;
        result.indicators.push('Số điện thoại quá ngắn');
    }
    
    // Check for very long numbers (likely fake)
    if (cleanPhone.length > 15) {
        result.score += 25;
        result.indicators.push('Số điện thoại quá dài');
    }
    
    // Check for numbers with all same digits
    if (/^(\d)\1+$/.test(cleanPhone)) {
        result.score += 40;
        result.indicators.push('Số điện thoại toàn chữ số giống nhau');
    }
    
    // Check for numbers with alternating patterns
    if (/^(\d{2})\1{2,}$/.test(cleanPhone)) {
        result.score += 35;
        result.indicators.push('Số điện thoại có mẫu lặp lại');
    }
    
    // Check for numbers that look like test numbers
    const testPatterns = [
        { pattern: /^123/, score: 20, indicator: 'Số test (123)' },
        { pattern: /^456/, score: 20, indicator: 'Số test (456)' },
        { pattern: /^789/, score: 20, indicator: 'Số test (789)' },
        { pattern: /^000/, score: 25, indicator: 'Số test (000)' },
        { pattern: /^111/, score: 25, indicator: 'Số test (111)' },
        { pattern: /^999/, score: 25, indicator: 'Số test (999)' }
    ];
    
    for (const pattern of testPatterns) {
        if (pattern.pattern.test(cleanPhone)) {
            result.score += pattern.score;
            result.indicators.push(pattern.indicator);
        }
    }
    
    return result;
}

// Check phone number against spam/scam database
function checkPhoneAgainstDatabase(cleanPhone) {
    const result = { score: 0, indicators: [] };
    
    // Check against spam numbers
    if (SPAM_PHONE_DATABASE.spam.includes(cleanPhone)) {
        result.score += 60;
        result.indicators.push('🚨 Số điện thoại có trong danh sách spam!');
    }
    
    // Check against scam numbers
    if (SPAM_PHONE_DATABASE.scam.includes(cleanPhone)) {
        result.score += 80;
        result.indicators.push('🚨 Số điện thoại có trong danh sách lừa đảo!');
    }
    
    // Check against premium rate scam numbers
    if (SPAM_PHONE_DATABASE.premium.includes(cleanPhone)) {
        result.score += 70;
        result.indicators.push('🚨 Số điện thoại có trong danh sách lừa đảo tính phí cao!');
    }
    
    // Check against fake bank numbers
    if (SPAM_PHONE_DATABASE.fakeBank.includes(cleanPhone)) {
        result.score += 85;
        result.indicators.push('🚨 Số điện thoại có trong danh sách giả mạo ngân hàng!');
    }
    
    // Check against lottery scam numbers
    if (SPAM_PHONE_DATABASE.lottery.includes(cleanPhone)) {
        result.score += 75;
        result.indicators.push('🚨 Số điện thoại có trong danh sách lừa đảo trúng thưởng!');
    }
    
    // Check against investment scam numbers
    if (SPAM_PHONE_DATABASE.investment.includes(cleanPhone)) {
        result.score += 80;
        result.indicators.push('🚨 Số điện thoại có trong danh sách lừa đảo đầu tư!');
    }
    
    // Check for similar patterns (fuzzy matching)
    const similarNumbers = findSimilarNumbers(cleanPhone);
    if (similarNumbers.length > 0) {
        result.score += 40;
        result.indicators.push(`⚠️ Số điện thoại tương tự với ${similarNumbers.length} số đáng ngờ trong database`);
    }
    
    return result;
}

// Find similar numbers in database
function findSimilarNumbers(cleanPhone) {
    const similar = [];
    const allNumbers = [
        ...SPAM_PHONE_DATABASE.spam,
        ...SPAM_PHONE_DATABASE.scam,
        ...SPAM_PHONE_DATABASE.premium,
        ...SPAM_PHONE_DATABASE.fakeBank,
        ...SPAM_PHONE_DATABASE.lottery,
        ...SPAM_PHONE_DATABASE.investment
    ];
    
    for (const number of allNumbers) {
        // Check if numbers are similar (same length, max 2 digits different)
        if (number.length === cleanPhone.length) {
            let differences = 0;
            for (let i = 0; i < number.length; i++) {
                if (number[i] !== cleanPhone[i]) {
                    differences++;
                }
            }
            if (differences <= 2) {
                similar.push(number);
            }
        }
    }
    
    return similar;
}

// Get category message
function getCategoryMessage(category) {
    switch (category) {
        case 'phishing':
            return '🚨 CẢNH BÁO: Email lừa đảo!';
        case 'spam':
            return '⚠️ CẢNH BÁO: Email spam!';
        case 'suspect':
            return '⚠️ CẢNH BÁO: Email đáng ngờ!';
        case 'safe':
            return '✅ An toàn';
        default:
            return '❓ Không xác định';
    }
}

// Get category label
function getCategoryLabel(category) {
    switch (category) {
        case 'phishing':
            return 'Phishing';
        case 'spam':
            return 'Spam';
        case 'suspect':
            return 'Nghi ngờ';
        case 'safe':
            return 'An toàn';
        default:
            return 'Không xác định';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
}

// Show result
function showResult(message, status, details = '') {
    const resultDiv = document.getElementById('checkResult');
    
    let statusClass = '';
    let icon = '';
    
    switch (status) {
        case 'safe':
            statusClass = 'safe';
            icon = 'fas fa-check-circle';
            break;
        case 'loading':
            statusClass = 'loading';
            icon = 'fas fa-spinner fa-spin';
            break;
        case 'warning':
            statusClass = 'warning';
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'error':
            statusClass = 'error';
            icon = 'fas fa-times-circle';
            break;
        case 'suspect':
            statusClass = 'suspect';
            icon = 'fas fa-exclamation-triangle';
            break;
        case 'spam':
            statusClass = 'spam';
            icon = 'fas fa-ban';
            break;
        case 'phishing':
            statusClass = 'phishing';
            icon = 'fas fa-fish';
            break;
        case 'critical':
            statusClass = 'critical';
            icon = 'fas fa-skull-crossbones';
            break;
        default:
            statusClass = 'info';
            icon = 'fas fa-info-circle';
    }
    
    resultDiv.innerHTML = `
        <div class="result-content ${statusClass}">
            <div class="result-icon">
                <i class="${icon}"></i>
            </div>
            <div class="result-text">
                <h4>${message}</h4>
                ${details ? `<p>${details.replace(/\n/g, '<br>')}</p>` : ''}
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

// Add event listener for Enter key
document.addEventListener('DOMContentLoaded', function() {
    const checkInput = document.getElementById('checkInput');
    if (checkInput) {
        checkInput.addEventListener('keypress', function(e) {
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
    
    // Store original content structure
    const originalContent = element.innerHTML;
    const statValue = element.querySelector('.stat-value');
    const statPlus = element.querySelector('.stat-plus');
    const statUnit = element.querySelector('.stat-unit');
    const statPercent = element.querySelector('.stat-percent');
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            const currentValue = Math.floor(start);
            if (statValue) {
                statValue.textContent = currentValue.toLocaleString();
            } else {
                element.textContent = currentValue;
            }
            requestAnimationFrame(updateCounter);
        } else {
            if (statValue) {
                statValue.textContent = target.toLocaleString();
            } else {
                element.textContent = target;
            }
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