/**
 * Editor utilities for the blog admin panel.
 */

// Debounce function for autosave
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all transform translate-y-0 opacity-100`;
    
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-500', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Confirm dialog
function confirmAction(message) {
    return new Promise((resolve) => {
        if (confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('Copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy', 'error');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('post-form');
        if (form) {
            form.submit();
        }
    }
});

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Initialize auto-resize for all textareas
document.querySelectorAll('textarea[data-autoresize]').forEach(textarea => {
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    autoResizeTextarea(textarea);
});

// Slug generator
function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// Word count
function countWords(text) {
    const stripped = text.replace(/<[^>]*>/g, '');
    const words = stripped.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

// Reading time estimate
function estimateReadingTime(wordCount) {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

// Export functions for use in templates
window.blogEditor = {
    debounce,
    formatFileSize,
    showNotification,
    confirmAction,
    copyToClipboard,
    generateSlug,
    countWords,
    estimateReadingTime
};
