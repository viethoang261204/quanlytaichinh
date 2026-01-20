// Quản lý đăng nhập và đăng ký

// Khởi tạo tài khoản admin mặc định
function initDefaultAdmin() {
    const users = getUsers();
    
    // Kiểm tra xem đã có admin chưa
    const adminExists = users.find(u => u.username === 'admin');
    
    if (!adminExists) {
        // Tạo tài khoản admin mặc định
        const adminUser = {
            id: 1,
            name: 'Administrator',
            username: 'admin',
            email: 'admin@admin.com',
            password: 'admin',
            createdAt: new Date().toISOString(),
            isAdmin: true
        };
        
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Tạo dữ liệu tài chính riêng cho admin
        const adminFinanceData = {
            debts: [],
            payments: [],
            incomes: [],
            expenses: [],
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`financeData_${adminUser.id}`, JSON.stringify(adminFinanceData));
    }
}

// Kiểm tra đăng nhập khi trang load
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo admin mặc định
    initDefaultAdmin();
    
    const currentUser = getCurrentUser();
    const currentPath = window.location.pathname;
    const currentFile = window.location.pathname.split('/').pop();
    
    // Nếu đã đăng nhập và đang ở trang login/register, chuyển về trang chủ
    if (currentUser && (currentFile === 'login.html' || currentFile === 'register.html' || currentFile === 'dang-nhap.html' || currentFile === 'dang-ky.html')) {
        window.location.href = '/trang-chu';
        return;
    }
    
    // Nếu chưa đăng nhập và đang ở trang cần đăng nhập, chuyển về trang đăng nhập
    if (!currentUser && (currentFile === 'trang-chu.html' || currentFile === 'trang-chu')) {
        window.location.href = '/dang-nhap';
        return;
    }
    
    // Xử lý routing cho các link
    setupRouting();
});

// Thiết lập routing cho các link
function setupRouting() {
    // Xử lý tất cả các link
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Bỏ qua link ngoài, anchor, mailto
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
                return;
            }
            
            // Nếu link không có .html và là route đã định nghĩa
            if (!href.includes('.html') && !href.includes('://')) {
                const routes = {
                    '/trang-chu': 'trang-chu.html',
                    '/dang-nhap': 'login.html',
                    '/dang-ky': 'register.html',
                    'trang-chu': 'trang-chu.html',
                    'dang-nhap': 'login.html',
                    'dang-ky': 'register.html'
                };
                
                const route = href.startsWith('/') ? href : '/' + href;
                const file = routes[route] || routes[href];
                
                if (file) {
                    e.preventDefault();
                    window.location.href = file;
                }
            }
        });
    });
}

// Đăng ký
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    // Ẩn thông báo cũ
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    // Validation
    if (password !== passwordConfirm) {
        showError('Mật khẩu xác nhận không khớp!');
        return;
    }
    
    if (password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
    }
    
    // Kiểm tra username đã tồn tại chưa
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        showError('Tên đăng nhập đã tồn tại!');
        return;
    }
    
    if (users.find(u => u.email === email)) {
        showError('Email đã được sử dụng!');
        return;
    }
    
    // Tạo user mới
    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        email: email,
        password: password, // Trong thực tế nên hash password
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Tạo dữ liệu tài chính riêng cho user
    const userFinanceData = {
        debts: [],
        payments: [],
        incomes: [],
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`financeData_${newUser.id}`, JSON.stringify(userFinanceData));
    
    // Hiển thị thông báo thành công
    successDiv.textContent = 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...';
    successDiv.classList.add('show');
    
    // Chuyển đến trang đăng nhập sau 2 giây
    setTimeout(() => {
        window.location.href = '/dang-nhap';
    }, 2000);
}

// Đăng nhập
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    const errorDiv = document.getElementById('errorMessage');
    
    // Ẩn thông báo cũ
    errorDiv.classList.remove('show');
    
    // Tìm user
    const users = getUsers();
    const user = users.find(u => 
        (u.username === username || u.email === username) && 
        u.password === password
    );
    
    if (!user) {
        showError('Tên đăng nhập/Email hoặc mật khẩu không đúng!');
        return;
    }
    
    // Lưu session
    const sessionData = {
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        loginTime: new Date().toISOString()
    };
    
    if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(sessionData));
    }
    
    // Chuyển đến trang chủ
    window.location.href = '/trang-chu';
}

// Đăng xuất
function handleLogout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    window.location.href = '/dang-nhap';
}

// Lấy danh sách users
function getUsers() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
}

// Lấy user hiện tại
function getCurrentUser() {
    const sessionUser = sessionStorage.getItem('currentUser');
    const localUser = localStorage.getItem('currentUser');
    
    if (sessionUser) {
        return JSON.parse(sessionUser);
    }
    
    if (localUser) {
        return JSON.parse(localUser);
    }
    
    return null;
}

// Lấy ID user hiện tại
function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

// Hiển thị lỗi
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

// Kiểm tra độ mạnh mật khẩu
function checkPasswordStrength() {
    const password = document.getElementById('registerPassword').value;
    const strengthDiv = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthDiv.textContent = '';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) {
        strengthDiv.textContent = 'Mật khẩu yếu';
        strengthDiv.className = 'password-strength weak';
    } else if (strength <= 3) {
        strengthDiv.textContent = 'Mật khẩu trung bình';
        strengthDiv.className = 'password-strength medium';
    } else {
        strengthDiv.textContent = 'Mật khẩu mạnh';
        strengthDiv.className = 'password-strength strong';
    }
}

