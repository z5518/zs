function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = document.querySelector('.menu-icon');
    navLinks.classList.toggle('active');
    menuIcon.classList.toggle('active');
}

// 修改后的函数，直接跳转到主页
function checkPassword() {
    window.location.href = 'index.html';
}

// 保留的DOMContentLoaded事件
document.addEventListener('DOMContentLoaded', () => {
    const savedPassword = sessionStorage.getItem('saved_password');
    if (savedPassword) {
        document.getElementById('password').value = savedPassword;
    }
});
