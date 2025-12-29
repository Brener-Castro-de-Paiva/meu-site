// ========================================
// MENU MOBILE
// ========================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    nav.classList.toggle('active');
});

// Fechar menu ao clicar em um link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        nav.classList.remove('active');
    });
});

// ========================================
// HEADER SCROLL
// ========================================

const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ========================================
// NAVEGAÇÃO ATIVA
// ========================================

const sections = document.querySelectorAll('section[id]');

function activeMenu() {
    const scrollY = window.scrollY;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => link.classList.remove('active'));
            if (navLink) navLink.classList.add('active');
        }
    });
}

window.addEventListener('scroll', activeMenu);

// ========================================
// SMOOTH SCROLL
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========================================
// ANIMAÇÃO DE SCROLL (INTERSECTION OBSERVER)
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 1s ease forwards';
        }
    });
}, observerOptions);

// Observar cards de serviços
document.querySelectorAll('.servico-card').forEach(card => {
    observer.observe(card);
});

// Observar outros elementos
document.querySelectorAll('.conte-caso-info, .conte-caso-form, .sobre-image, .sobre-text').forEach(element => {
    observer.observe(element);
});

// ========================================
// FORMULÁRIO - CONTE SEU CASO
// ========================================

const caseForm = document.getElementById('caseForm');

caseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        area: document.getElementById('area').value,
        mensagem: document.getElementById('mensagem').value,
        data: new Date().toLocaleString('pt-BR')
    };
    
    // Validação básica
    if (!formData.nome || !formData.email || !formData.telefone || !formData.area || !formData.mensagem) {
        showNotification('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showNotification('Por favor, insira um e-mail válido', 'error');
        return;
    }
    
    try {
        // Aqui você pode integrar com seu backend ou serviço de email
        // Por enquanto, vamos simular o envio
        
        // Desabilitar botão durante envio
        const submitBtn = caseForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        // Simular envio (remova isso e adicione sua lógica real)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Você pode enviar para WhatsApp
        const whatsappMessage = `
*Novo Caso Recebido*

*Nome:* ${formData.nome}
*Email:* ${formData.email}
*Telefone:* ${formData.telefone}
*Área:* ${formData.area}

*Mensagem:*
${formData.mensagem}
        `.trim();
        
        const whatsappUrl = `https://wa.me/5524981191013?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Mostrar mensagem de sucesso
        showNotification('Caso enviado com sucesso! Entraremos em contato em breve.', 'success');
        
        // Resetar formulário
        caseForm.reset();
        
        // Abrir WhatsApp (opcional)
        setTimeout(() => {
            if (confirm('Deseja enviar também pelo WhatsApp?')) {
                window.open(whatsappUrl, '_blank');
            }
        }, 1500);
        
        // Restaurar botão
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showNotification('Erro ao enviar. Tente novamente mais tarde.', 'error');
        
        // Restaurar botão
        const submitBtn = caseForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// ========================================
// SISTEMA DE NOTIFICAÇÕES
// ========================================

function showNotification(message, type = 'success') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Adicionar estilos
    Object.assign(notification.style, {
        position: 'fixed',
        top: '100px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: '9999',
        animation: 'slideInRight 0.3s ease',
        fontSize: '1rem',
        fontWeight: '500',
        maxWidth: '90%'
    });
    
    document.body.appendChild(notification);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ========================================
// MÁSCARAS DE TELEFONE
// ========================================

const telefoneInput = document.getElementById('telefone');

telefoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
        value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    
    e.target.value = value;
});

// ========================================
// CONTADOR DE CARACTERES NO TEXTAREA
// ========================================

const mensagemTextarea = document.getElementById('mensagem');
const maxChars = 1000;

mensagemTextarea.addEventListener('input', (e) => {
    const currentLength = e.target.value.length;
    
    if (currentLength >= maxChars) {
        e.target.value = e.target.value.substring(0, maxChars);
    }
    
    // Adicionar contador se não existir
    let counter = mensagemTextarea.parentElement.querySelector('.char-counter');
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = 'text-align: right; font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;';
        mensagemTextarea.parentElement.appendChild(counter);
    }
    
    counter.textContent = `${currentLength}/${maxChars} caracteres`;
    
    if (currentLength >= maxChars * 0.9) {
        counter.style.color = '#ef4444';
    } else {
        counter.style.color = '#6c757d';
    }
});

// ========================================
// SCROLL TO TOP BUTTON
// ========================================

// Criar botão de voltar ao topo
const scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #006d77;
    color: white;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 999;
`;

document.body.appendChild(scrollTopBtn);

// Mostrar/ocultar botão
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.style.opacity = '1';
        scrollTopBtn.style.visibility = 'visible';
    } else {
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.visibility = 'hidden';
    }
});

// Scroll to top ao clicar
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

scrollTopBtn.addEventListener('mouseenter', () => {
    scrollTopBtn.style.transform = 'translateY(-5px)';
    scrollTopBtn.style.background = '#343a40';
});

scrollTopBtn.addEventListener('mouseleave', () => {
    scrollTopBtn.style.transform = 'translateY(0)';
    scrollTopBtn.style.background = '#006d77';
});

// ========================================
// PRELOADER (opcional)
// ========================================

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ========================================
// LOGS PARA DEBUG
// ========================================

console.log('%c Paiva & Rocha Advocacia ', 'background: #006d77; color: white; font-size: 20px; padding: 10px;');
console.log('Site desenvolvido com HTML, CSS e JavaScript puro');
console.log('Contato: (24) 98119-1013');