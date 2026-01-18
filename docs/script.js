// ========================================
// CONFIGURAÇÃO - MODO HÍBRIDO
// ========================================

// ⚠️ ALTERNAR ENTRE GITHUB PAGES E PHP
// true = usa PHP | false = usa EmailJS (GitHub Pages)
const USE_PHP_BACKEND = true; // Mude para false se usar GitHub Pages

// ⚠️ IMPORTANTE: Substitua pelas suas chaves
const RECAPTCHA_SITE_KEY = '6Lct2kksAAAAAJ7euOtaYBoM0_8bWWx6HRTWguah';

// Configuração EmailJS (para GitHub Pages)
const EMAILJS_PUBLIC_KEY = 'IqHDimQLY60CZtTjj';
const EMAILJS_SERVICE_ID = 'service_w0gdkhf';
const EMAILJS_TEMPLATE_ID = 'template_d16liqn';

// Configuração PHP (para quando migrar)
const PHP_BACKEND_URL = 'https://paivaerocha.com.br/enviar-caso.php';

// ========================================
// INICIALIZAR EMAILJS (APENAS SE NECESSÁRIO)
// ========================================

if (!USE_PHP_BACKEND && typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS inicializado para GitHub Pages');
}

// ========================================
// ELEMENTOS DO DOM
// ========================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.getElementById('header');
const caseForm = document.getElementById('caseForm');
const telefoneInput = document.getElementById('telefone');
const mensagemTextarea = document.getElementById('mensagem');
const maxChars = 1000;

// ========================================
// MENU MOBILE
// ========================================

if (mobileMenuBtn && nav) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        nav.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        });
    });
}

// ========================================
// HEADER SCROLL
// ========================================

if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

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
// ANIMAÇÃO DE SCROLL
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

document.querySelectorAll('.servico-card').forEach(card => {
    observer.observe(card);
});

document.querySelectorAll('.conte-caso-info, .conte-caso-form, .sobre-image, .sobre-text').forEach(element => {
    observer.observe(element);
});

// ========================================
// FORMULÁRIO - ENVIO
// ========================================

if (caseForm) {
    caseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coletar dados do formulário
        const formData = {
            nome: document.getElementById('nome').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            area: document.getElementById('area').value,
            mensagem: document.getElementById('mensagem').value.trim(),
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
        
        // Desabilitar botão durante envio
        const submitBtn = caseForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        try {
            // PASSO 1: Executar reCAPTCHA
            const token = await executeRecaptcha('submit_form');
            
            if (!token) {
                throw new Error('Falha na verificação de segurança');
            }
            
            console.log('✅ Token reCAPTCHA gerado');
            
            // PASSO 2: Escolher método de envio
            if (USE_PHP_BACKEND) {
                // MODO PHP: Validação backend real
                await enviarViaPHP(token, formData);
            } else {
                // MODO GITHUB: EmailJS direto
                await enviarViaEmailJS(formData);
            }
            
            // PASSO 3: Mostrar opções de contato
            const whatsappMessage = criarMensagemWhatsApp(formData);
            mostrarOpcoesContato(whatsappMessage);
            
            // Mostrar mensagem de sucesso
            showNotification('✅ Caso enviado com sucesso! Todos os sócios receberam seu e-mail.', 'success');
            
            // Resetar formulário
            caseForm.reset();
            
            // Scroll suave para as opções
            setTimeout(() => {
                const contatoOpcoes = document.getElementById('contatoOpcoes');
                if (contatoOpcoes) {
                    contatoOpcoes.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Erro ao processar formulário:', error);
            
            let errorMessage = '❌ ' + (error.message || 'Erro ao enviar. Tente novamente mais tarde.');
            
            showNotification(errorMessage, 'error');
            
        } finally {
            // Restaurar botão
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// ========================================
// FUNÇÃO PARA EXECUTAR RECAPTCHA V3
// ========================================

async function executeRecaptcha(action) {
    try {
        if (typeof grecaptcha === 'undefined') {
            throw new Error('reCAPTCHA não carregado. Recarregue a página.');
        }
        
        await new Promise((resolve) => {
            grecaptcha.ready(resolve);
        });
        
        const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: action });
        
        if (!token) {
            throw new Error('Token não gerado');
        }
        
        return token;
        
    } catch (error) {
        console.error('Erro ao executar reCAPTCHA:', error);
        throw new Error('Falha na verificação de segurança');
    }
}

// ========================================
// ENVIAR VIA PHP (VALIDAÇÃO BACKEND REAL)
// ========================================

async function enviarViaPHP(token, formData) {
    const response = await fetch(PHP_BACKEND_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            token: token,
            formData: formData
        })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
        console.error('❌ Erro do servidor:', result);
        throw new Error(result.error || 'Erro ao enviar caso');
    }
    
    console.log('✅ Validação backend bem-sucedida - Score:', result.score);
    return result;
}

// ========================================
// ENVIAR VIA EMAILJS (GITHUB PAGES)
// ========================================

async function enviarViaEmailJS(formData) {
    // Verificar se emailjs está disponível
    if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS não está carregado. Verifique o script no HTML.');
    }
    
    const templateParams = {
        to_email: 'paivaerocha123@gmail.com',
        from_name: formData.nome,
        from_email: formData.email,
        phone: formData.telefone,
        area: formData.area,
        message: formData.mensagem,
        date: formData.data
    };
    
    const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
    );
    
    if (response.status !== 200) {
        throw new Error('Erro ao enviar e-mail');
    }
    
    console.log('✅ Email enviado via EmailJS');
    return response;
}

// ========================================
// FUNÇÃO PARA CRIAR MENSAGEM WHATSAPP
// ========================================

function criarMensagemWhatsApp(formData) {
    return `
*🔔 Novo Caso Jurídico - Paiva & Rocha Advocacia*
━━━━━━━━━━━━━━━━━━━━

👤 *Nome:* ${formData.nome}
📧 *Email:* ${formData.email}
📱 *Telefone:* ${formData.telefone}
⚖️ *Área:* ${formData.area}

📝 *Descrição do Caso:*
${formData.mensagem}

━━━━━━━━━━━━━━━━━━━━
🕐 *Enviado em:* ${formData.data}
    `.trim();
}

// ========================================
// FUNÇÃO PARA MOSTRAR OPÇÕES DE CONTATO
// ========================================

function mostrarOpcoesContato(mensagem) {
    const contatoOpcoes = document.getElementById('contatoOpcoes');
    const btnBrener = document.getElementById('btnBrener');
    const btnPaulo = document.getElementById('btnPaulo');
    
    if (!contatoOpcoes || !btnBrener || !btnPaulo) return;
    
    const urlBrener = `https://wa.me/5524981191013?text=${encodeURIComponent(mensagem)}`;
    const urlPaulo = `https://wa.me/5524999891676?text=${encodeURIComponent(mensagem)}`;
    
    btnBrener.href = urlBrener;
    btnPaulo.href = urlPaulo;
    
    contatoOpcoes.style.display = 'block';
}

// ========================================
// SISTEMA DE NOTIFICAÇÕES
// ========================================

function showNotification(message, type = 'success') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '80px',
        right: '20px',
        padding: '15px 20px',
        background: type === 'success' ? '#10b981' : '#ef4444',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '400px'
    });
    
    document.body.appendChild(notification);
    
    // Adicionar animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ========================================
// MÁSCARA DE TELEFONE
// ========================================

if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        
        e.target.value = value;
    });
}

// ========================================
// CONTADOR DE CARACTERES NO TEXTAREA
// ========================================

if (mensagemTextarea) {
    mensagemTextarea.addEventListener('input', (e) => {
        const currentLength = e.target.value.length;
        
        if (currentLength >= maxChars) {
            e.target.value = e.target.value.substring(0, maxChars);
        }
        
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
}

// ========================================
// SCROLL TO TOP BUTTON
// ========================================

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

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.style.opacity = '1';
        scrollTopBtn.style.visibility = 'visible';
    } else {
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.visibility = 'hidden';
    }
});

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
// PRELOADER
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
console.log('🔧 Modo:', USE_PHP_BACKEND ? 'PHP Backend' : 'GitHub Pages (EmailJS)');
console.log('🛡️ reCAPTCHA v3:', USE_PHP_BACKEND ? 'Validação backend' : 'Frontend apenas');
console.log('📧 Email:', USE_PHP_BACKEND ? 'Via PHP' : 'Via EmailJS');
console.log('💬 WhatsApp: Disponível após envio');
console.log('📱 Contato: (24) 98119-1013');