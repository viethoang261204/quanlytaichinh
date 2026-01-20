// Hệ thống routing đơn giản cho HTML tĩnh
// File này sẽ xử lý các link để không hiện .html

(function() {
    'use strict';
    
    // Mapping routes
    const routeMap = {
        '/': 'trang-chu.html',
        '/trang-chu': 'trang-chu.html',
        '/dang-nhap': 'login.html',
        '/dang-ky': 'register.html',
        'trang-chu': 'trang-chu.html',
        'dang-nhap': 'login.html',
        'dang-ky': 'register.html'
    };
    
    // Xử lý khi trang load
    function initRouting() {
        const path = window.location.pathname;
        const hash = window.location.hash.replace('#', '');
        
        // Xử lý hash routing nếu có
        if (hash && routeMap[hash]) {
            window.location.href = routeMap[hash];
            return;
        }
        
        // Xử lý path routing
        const cleanPath = path.replace(/\.html$/, '').replace(/\/$/, '') || '/';
        if (routeMap[cleanPath] && !path.endsWith('.html')) {
            // Redirect đến file HTML tương ứng
            window.location.href = routeMap[cleanPath];
            return;
        }
        
        // Thiết lập các link
        setupLinks();
    }
    
    // Thiết lập các link để không hiện .html
    function setupLinks() {
        // Xử lý tất cả các link <a>
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            
            // Bỏ qua link ngoài, anchor, mailto, javascript
            if (href.startsWith('http') || 
                href.startsWith('#') || 
                href.startsWith('mailto:') || 
                href.startsWith('javascript:')) {
                return;
            }
            
            // Nếu link có .html, thay thế
            if (href.includes('.html')) {
                const cleanHref = href.replace('.html', '');
                link.setAttribute('href', cleanHref);
                link.setAttribute('data-route', cleanHref);
            }
            
            // Xử lý click
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href') || this.getAttribute('data-route');
                
                if (!href) return;
                
                // Tìm route tương ứng
                const route = href.startsWith('/') ? href : '/' + href;
                const targetFile = routeMap[route] || routeMap[href];
                
                if (targetFile && !href.includes('.html')) {
                    e.preventDefault();
                    window.location.href = targetFile;
                }
            });
        });
    }
    
    // Chạy khi DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRouting);
    } else {
        initRouting();
    }
    
    // Export hàm navigate để sử dụng ở nơi khác
    window.navigateTo = function(route) {
        const targetFile = routeMap[route] || routeMap['/' + route];
        if (targetFile) {
            window.location.href = targetFile;
        }
    };
})();

