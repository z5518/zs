document.addEventListener('DOMContentLoaded', () => {
    // FAQ 展开收起功能
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.display === 'block';

            // 关闭其他已打开的FAQ
            document.querySelectorAll('.faq-answer').forEach(ans => {
                ans.style.display = 'none';
                ans.previousElementSibling.classList.remove('active');
            });

            // 切换当前FAQ
            if (!isOpen) {
                answer.style.display = 'block';
                question.classList.add('active');
                window.scrollTo({ top: question.offsetTop - document.querySelector('header').offsetHeight, behavior: 'smooth' });
            } else {
                answer.style.display = 'none';
                question.classList.remove('active');
            }
        });
    });
});
