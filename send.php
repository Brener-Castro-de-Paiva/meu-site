<?php
// enviar-caso.php

// ========================================
// CONFIGURAÇÕES
// ========================================

// ⚠️ IMPORTANTE: Substitua pelas suas chaves
define('RECAPTCHA_SECRET_KEY', 'SUA_SECRET_KEY_AQUI');
define('EMAIL_DESTINO', 'paivaerocha123@gmail.com');
define('SCORE_MINIMO', 0.5); // Ajuste conforme necessário

// Permitir CORS (Cross-Origin Resource Sharing)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Responder OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Aceitar apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// ========================================
// RECEBER DADOS
// ========================================

$json = file_get_contents('php://input');
$dados = json_decode($json, true);

if (!$dados) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados inválidos']);
    exit;
}

$token = $dados['token'] ?? '';
$formData = $dados['formData'] ?? [];

// Validar dados obrigatórios
if (empty($token) || empty($formData['nome']) || empty($formData['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos']);
    exit;
}

// ========================================
// PASSO 1: VALIDAR RECAPTCHA
// ========================================

$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$recaptchaData = [
    'secret' => RECAPTCHA_SECRET_KEY,
    'response' => $token,
    'remoteip' => $_SERVER['REMOTE_ADDR']
];

$options = [
    'http' => [
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'method' => 'POST',
        'content' => http_build_query($recaptchaData)
    ]
];

$context = stream_context_create($options);
$recaptchaResponse = file_get_contents($recaptchaUrl, false, $context);
$recaptchaResult = json_decode($recaptchaResponse, true);

// Verificar se a validação foi bem-sucedida
if (!$recaptchaResult['success']) {
    error_log('❌ reCAPTCHA falhou: ' . print_r($recaptchaResult['error-codes'], true));
    http_response_code(400);
    echo json_encode([
        'error' => 'Verificação de segurança falhou',
        'details' => $recaptchaResult['error-codes'] ?? []
    ]);
    exit;
}

// Verificar o score
$score = $recaptchaResult['score'] ?? 0;

if ($score < SCORE_MINIMO) {
    error_log("⚠️ Score baixo detectado: $score");
    http_response_code(400);
    echo json_encode([
        'error' => 'Atividade suspeita detectada. Tente novamente.',
        'score' => $score
    ]);
    exit;
}

error_log("✅ reCAPTCHA validado - Score: $score");

// ========================================
// PASSO 2: ENVIAR EMAIL
// ========================================

// Sanitizar dados
$nome = filter_var($formData['nome'], FILTER_SANITIZE_STRING);
$email = filter_var($formData['email'], FILTER_SANITIZE_EMAIL);
$telefone = filter_var($formData['telefone'], FILTER_SANITIZE_STRING);
$area = filter_var($formData['area'], FILTER_SANITIZE_STRING);
$mensagem = filter_var($formData['mensagem'], FILTER_SANITIZE_STRING);
$data = $formData['data'] ?? date('d/m/Y H:i:s');

// Validar email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'E-mail inválido']);
    exit;
}

// Assunto do email
$assunto = "🔔 Novo Caso Jurídico - $nome";

// Corpo do email em HTML
$corpoEmail = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #006d77, #343a40); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
        }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { 
            background: #f8f9fa; 
            padding: 30px; 
            border-radius: 0 0 10px 10px; 
        }
        .field { 
            background: white; 
            margin-bottom: 20px; 
            padding: 15px; 
            border-left: 4px solid #006d77; 
            border-radius: 5px; 
        }
        .label { 
            font-weight: bold; 
            color: #006d77; 
            display: block; 
            margin-bottom: 8px; 
            font-size: 14px;
        }
        .value { 
            color: #333; 
            font-size: 15px; 
            word-wrap: break-word;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            font-size: 12px; 
            color: #666; 
        }
        .badge {
            display: inline-block;
            background: #4caf50;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 11px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>⚖️ Paiva & Rocha Advocacia</h1>
            <p>Novo Caso Recebido</p>
            <span class='badge'>Score de Segurança: " . number_format($score, 2) . "</span>
        </div>
        
        <div class='content'>
            <div class='field'>
                <span class='label'>👤 Nome Completo</span>
                <div class='value'>$nome</div>
            </div>
            
            <div class='field'>
                <span class='label'>📧 E-mail</span>
                <div class='value'><a href='mailto:$email'>$email</a></div>
            </div>
            
            <div class='field'>
                <span class='label'>📱 Telefone</span>
                <div class='value'><a href='tel:$telefone'>$telefone</a></div>
            </div>
            
            <div class='field'>
                <span class='label'>⚖️ Área do Direito</span>
                <div class='value'>$area</div>
            </div>
            
            <div class='field'>
                <span class='label'>📝 Descrição do Caso</span>
                <div class='value'>" . nl2br($mensagem) . "</div>
            </div>
            
            <div class='field'>
                <span class='label'>🕐 Data de Envio</span>
                <div class='value'>$data</div>
            </div>
        </div>
        
        <div class='footer'>
            <p>🛡️ Este caso foi verificado pelo sistema de segurança Google reCAPTCHA v3</p>
            <p>Score de confiabilidade: <strong>" . number_format($score * 100, 0) . "%</strong></p>
            <p style='margin-top: 15px;'>© 2025 Paiva & Rocha Advocacia - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
";

// Headers do email
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: Sistema Paiva & Rocha <noreply@paivarocha.com.br>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
    'X-Priority: 1',
    'Importance: High'
];

// Enviar email
$emailEnviado = mail(
    EMAIL_DESTINO,
    $assunto,
    $corpoEmail,
    implode("\r\n", $headers)
);

if (!$emailEnviado) {
    error_log('❌ Erro ao enviar email');
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao enviar e-mail']);
    exit;
}

error_log("✅ Email enviado com sucesso para: " . EMAIL_DESTINO);

// ========================================
// PASSO 3: RETORNAR SUCESSO
// ========================================

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Caso enviado com sucesso!',
    'score' => $score
]);

// Log de sucesso
error_log("✅ Caso processado com sucesso - Cliente: $nome - Score: $score");
?>