<?php
// enviar-caso.php

// Configurações
define('RECAPTCHA_SECRET_KEY', '6Lct2kksAAAAAJQ5_qDkyWgSC3ywnVMmCMEH-S1s');
define('EMAIL_DESTINO', 'paivaerocha123@gmail.com');
define('SCORE_MINIMO', 0.5);

// Permitir CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Preflight
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

// Receber dados JSON
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

// Validar reCAPTCHA
$recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
$recaptchaData = [
    'secret' => RECAPTCHA_SECRET_KEY,
    'response' => $token
];

$ch = curl_init($recaptchaUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($recaptchaData),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true
]);

$recaptchaResponse = curl_exec($ch);
curl_close($ch);
$recaptchaResult = json_decode($recaptchaResponse, true);

if (!$recaptchaResult['success']) {
    http_response_code(400);
    echo json_encode(['error' => 'Falha na verificação de segurança']);
    exit;
}

$score = $recaptchaResult['score'] ?? 0;
if ($score < SCORE_MINIMO) {
    http_response_code(400);
    echo json_encode(['error' => 'Atividade suspeita detectada']);
    exit;
}

// Preparar dados
$nome = htmlspecialchars($formData['nome'], ENT_QUOTES, 'UTF-8');
$email = filter_var($formData['email'], FILTER_SANITIZE_EMAIL);
$telefone = htmlspecialchars($formData['telefone'], ENT_QUOTES, 'UTF-8');
$area = htmlspecialchars($formData['area'], ENT_QUOTES, 'UTF-8');
$mensagem = htmlspecialchars($formData['mensagem'], ENT_QUOTES, 'UTF-8');
$data = $formData['data'] ?? date('d/m/Y H:i:s');

// Validar email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'E-mail inválido']);
    exit;
}

// Enviar email
$assunto = "🔔 Novo Caso Jurídico - $nome";
$headers = "From: Paiva & Rocha <noreply@paivaerocha.com.br>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";

$corpoEmail = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: #006d77; color: white; padding: 20px; }
        .content { padding: 20px; background: #f9f9f9; }
        .field { margin-bottom: 15px; padding: 10px; background: white; }
        .label { font-weight: bold; color: #006d77; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>⚖️ Paiva & Rocha Advocacia - Novo Caso</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Nome:</div>
                <div>$nome</div>
            </div>
            <div class='field'>
                <div class='label'>Email:</div>
                <div>$email</div>
            </div>
            <div class='field'>
                <div class='label'>Telefone:</div>
                <div>$telefone</div>
            </div>
            <div class='field'>
                <div class='label'>Área do Direito:</div>
                <div>$area</div>
            </div>
            <div class='field'>
                <div class='label'>Mensagem:</div>
                <div>" . nl2br($mensagem) . "</div>
            </div>
            <div class='field'>
                <div class='label'>Data:</div>
                <div>$data</div>
            </div>
        </div>
    </div>
</body>
</html>
";

// Tentar enviar email
if (mail(EMAIL_DESTINO, $assunto, $corpoEmail, $headers)) {
    echo json_encode([
        'success' => true,
        'message' => 'Caso enviado com sucesso!',
        'score' => $score
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao enviar e-mail']);
}
?>