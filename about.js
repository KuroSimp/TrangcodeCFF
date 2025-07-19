// Mobile menu toggle
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

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Smooth scrolling for anchor links
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

// Add scroll effect to header
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

// API Base URL
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const totalEmailsElement = document.getElementById('totalEmails');
const safeEmailsElement = document.getElementById('safeEmails');
const suspectEmailsElement = document.getElementById('suspectEmails');
const spamEmailsElement = document.getElementById('spamEmails');
const phishingEmailsElement = document.getElementById('phishingEmails');

// Load dashboard data
async function loadDashboardData() {
    try {
        console.log('🔄 Loading dashboard data...');
        
        // Test database connection first
        console.log('Testing database connection...');
        const connectionTest = await fetch(`${API_BASE_URL}/test`);
        const connectionResult = await connectionTest.json();
        console.log('Connection test result:', connectionResult);
        
        if (!connectionTest.ok) {
            throw new Error('Database connection failed');
        }
        
        // Get recent emails for analysis
        console.log('Fetching emails data...');
        const emailsResponse = await fetch(`${API_BASE_URL}/emails?limit=100`);
        const emailsData = await emailsResponse.json();
        console.log('Emails data received:', emailsData);
        
        if (!emailsData.success) {
            throw new Error('Failed to fetch emails data');
        }
        
        // Sort emails by received_time (newest first)
        const sortedEmails = emailsData.data.sort((a, b) => {
            const dateA = new Date(a.received_time);
            const dateB = new Date(b.received_time);
            return dateB - dateA; // Newest first
        });
        
        console.log('Sorted emails:', sortedEmails.slice(0, 5));
        
        // Process and display data
        displayStatistics(sortedEmails);
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        displayError('Không thể kết nối đến database. Vui lòng kiểm tra server.');
        
        // Show error in UI
        const tableBody = document.getElementById('emailTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; color: red; padding: 20px;">
                        ❌ Lỗi kết nối database: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// Display statistics
function displayStatistics(emails) {
    console.log('Displaying statistics for emails:', emails);
    
    if (!emails || emails.length === 0) {
        displayError('Không có dữ liệu email để hiển thị.');
        return;
    }
    
    // Calculate statistics
    const totalEmails = emails.length;
    const emailCategories = categorizeEmails(emails);
    
    console.log('Email categories:', emailCategories);
    
    // Update statistics cards
    updateStatCard('totalEmails', totalEmails);
    updateStatCard('safeEmails', emailCategories.safe);
    updateStatCard('suspectEmails', emailCategories.suspect);
    updateStatCard('spamEmails', emailCategories.spam);
    updateStatCard('phishingEmails', emailCategories.phishing);
    
    // Update chart
    updateChart(emailCategories, totalEmails);
    
    // Update table with real data
    updateEmailTable(emails);
}

// Categorize emails based on content analysis
function categorizeEmails(emails) {
    const categories = {
        safe: 0,
        suspect: 0,
        spam: 0,
        phishing: 0
    };
    
    emails.forEach(email => {
        const category = analyzeEmailCategory(email);
        categories[category]++;
    });
    
    return categories;
}

// Analyze email category based on content
function analyzeEmailCategory(email) {
    const title = (email.title || '').toLowerCase();
    const content = (email.content || '').toLowerCase();
    const fromEmail = (email.from_email || '').toLowerCase();
    
    // Phishing indicators
    const phishingKeywords = [
        'tài khoản bị khóa', 'xác minh ngay', 'bảo mật khẩn cấp',
        'paypal', 'amazon', 'facebook', 'google', 'microsoft',
        'tài khoản ngân hàng', 'thông tin cá nhân', 'mật khẩu'
    ];
    
    // Spam indicators
    const spamKeywords = [
        'giảm giá', 'khuyến mãi', 'trúng thưởng', 'miễn phí',
        'thuốc', 'viagra', 'cửa hàng', 'mua ngay', 'chỉ hôm nay'
    ];
    
    // Suspect indicators
    const suspectKeywords = [
        'xác nhận', 'xác minh', 'cập nhật', 'thông báo',
        'yêu cầu', 'cần thiết', 'quan trọng'
    ];
    
    // Check for phishing
    const hasPhishingKeywords = phishingKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
    );
    
    // Check for spam
    const hasSpamKeywords = spamKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
    );
    
    // Check for suspicious domains
    const suspiciousDomains = [
        'verify', 'security', 'update', 'confirm', 'login',
        'bank', 'pay', 'secure', 'account'
    ];
    
    const hasSuspiciousDomain = suspiciousDomains.some(domain => 
        fromEmail.includes(domain)
    );
    
    if (hasPhishingKeywords || hasSuspiciousDomain) {
        return 'phishing';
    } else if (hasSpamKeywords) {
        return 'spam';
    } else if (hasPhishingKeywords || hasSuspiciousDomain) {
        return 'suspect';
    } else {
        return 'safe';
    }
}

// Update statistics card
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value.toLocaleString();
    }
}

// Update chart with real data
function updateChart(categories, total) {
    const chart = document.getElementById('emailChart');
    if (!chart) return;
    
    // Clear existing chart
    chart.innerHTML = '';
    
    // Create chart bars
    Object.entries(categories).forEach(([category, count]) => {
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar';
        
        barContainer.innerHTML = `
            <div class="bar-label">${getCategoryLabel(category)}</div>
            <div class="bar-container">
                <div class="bar ${category}-bar" style="width: ${percentage}%"></div>
                <span class="bar-percentage">${percentage}%</span>
            </div>
        `;
        
        chart.appendChild(barContainer);
    });
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        safe: 'An toàn',
        suspect: 'Nghi ngờ',
        spam: 'Spam',
        phishing: 'Phishing'
    };
    return labels[category] || category;
}

// Update email table with real data
function updateEmailTable(emails) {
    const tableBody = document.getElementById('emailTableBody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows (emails are already sorted by received_time)
    emails.slice(0, 10).forEach((email, index) => {
        const category = analyzeEmailCategory(email);
        const row = createEmailRow(email, email.id, category); // Use actual email ID
        tableBody.appendChild(row);
    });
    
    console.log(`Updated table with ${Math.min(emails.length, 10)} emails`);
}

// Create email table row
function createEmailRow(email, id, category) {
    const row = document.createElement('tr');
    row.className = `email-row ${category}`;
    
    const confidenceScore = calculateConfidenceScore(email, category);
    const riskLevel = getRiskLevel(confidenceScore);
    
    row.innerHTML = `
        <td>#${String(id).padStart(3, '0')}</td>
        <td>${email.from_email || 'N/A'}</td>
        <td>${email.to_email || 'N/A'}</td>
        <td>${email.title || 'N/A'}</td>
        <td>${truncateText(email.content || 'N/A', 50)}</td>
        <td>${formatDate(email.received_time)}</td>
        <td><span class="badge ${category}">${getCategoryLabel(category)}</span></td>
        <td>${getSuspiciousIndicators(email, category)}</td>
        <td><span class="score ${getScoreClass(confidenceScore)}">${confidenceScore}%</span></td>
        <td><span class="risk-level ${riskLevel}">${getRiskLabel(riskLevel)}</span></td>
        <td>${formatDate(email.received_time)}</td>
        <td>
            <button class="btn-icon" onclick="viewEmail(${id})">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-icon" onclick="deleteEmail(${id})">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Calculate confidence score
function calculateConfidenceScore(email, category) {
    let score = 50; // Base score
    
    const title = (email.title || '').toLowerCase();
    const content = (email.content || '').toLowerCase();
    
    // Add points based on category indicators
    switch (category) {
        case 'phishing':
            if (title.includes('tài khoản') || title.includes('bảo mật')) score += 30;
            if (content.includes('xác minh') || content.includes('khẩn cấp')) score += 20;
            break;
        case 'spam':
            if (title.includes('giảm giá') || title.includes('khuyến mãi')) score += 25;
            if (content.includes('miễn phí') || content.includes('trúng thưởng')) score += 25;
            break;
        case 'suspect':
            if (title.includes('xác nhận') || title.includes('thông báo')) score += 15;
            if (content.includes('yêu cầu') || content.includes('cần thiết')) score += 15;
            break;
        case 'safe':
            score += 40; // Safe emails get high confidence
            break;
    }
    
    return Math.min(score, 100);
}

// Get risk level
function getRiskLevel(score) {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

// Get risk label
function getRiskLabel(level) {
    const labels = {
        critical: 'Nghiêm trọng',
        high: 'Cao',
        medium: 'Trung bình',
        low: 'Thấp'
    };
    return labels[level] || level;
}

// Get score class
function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

// Get suspicious indicators
function getSuspiciousIndicators(email, category) {
    const indicators = [];
    
    if (category === 'phishing') {
        indicators.push('Suspicious domain', 'Urgency', 'Request for credentials');
    } else if (category === 'spam') {
        indicators.push('Unwanted content', 'Excessive promotion', 'Suspicious links');
    } else if (category === 'suspect') {
        indicators.push('Generic greeting', 'Request for personal info');
    } else {
        indicators.push('None');
    }
    
    return indicators.join(', ');
}

// Utility functions
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Display error message
function displayError(message) {
    console.error('Error:', message);
    // You can add error display UI here
}

// Filter functions
function applyFilters() {
    console.log('🔍 Applying filters...');
    // Implement filter logic here
}

function resetFilters() {
    console.log('🔄 Resetting filters...');
    // Implement reset logic here
}

// Action functions
function viewEmail(id) {
    console.log(`👁️ Viewing email ${id}`);
    // Implement view email logic here
}

function deleteEmail(id) {
    console.log(`🗑️ Deleting email ${id}`);
    // Implement delete email logic here
}

function exportData() {
    console.log('📊 Exporting data...');
    // Implement export logic here
}

function refreshTable() {
    console.log('🔄 Refreshing table...');
    loadDashboardData();
}

// Pagination functions
function previousPage() {
    console.log('⬅️ Previous page');
    // Implement pagination logic here
}

function nextPage() {
    console.log('➡️ Next page');
    // Implement pagination logic here
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing dashboard...');
    loadDashboardData();
    
    // Set up auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});

// Export functions for global access
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.viewEmail = viewEmail;
window.deleteEmail = deleteEmail;
window.exportData = exportData;
window.refreshTable = refreshTable;
window.previousPage = previousPage;
window.nextPage = nextPage; 