$(document).ready(function() {
    
    // --- Instanciador del Modal de Bootstrap ---
    var messageModal = new bootstrap.Modal(document.getElementById('message-modal'));

    // --- Función para mostrar mensajes ---
    function showModalMessage(title, message) {
        $('#modal-title').text(title);
        $('#modal-message').text(message);
        messageModal.show();
    }
    // Requisitos de la prueba técnica Inetum //
    // --- Contador de Caracteres  ---
    const maxLen = 160;
    $('#mensaje').on('keyup', function() {
        const currentLen = $(this).val().length;
        const remaining = maxLen - currentLen;
        
        const $counter = $('#char-counter');
        $counter.text(remaining + ' caracteres restantes');
        
        if (remaining < 0) {
            $counter.addClass('invalid');
        } else {
            $counter.removeClass('invalid');
        }
    });

    // --- Validación y Envío AJAX  ---
    $('#contact-form').on('submit', function(e) {
        e.preventDefault(); // Evitar envío tradicional
        
        if (validateForm()) {
            // Formulario válido, proceder con AJAX
            sendAjaxRequest();
        }
    });

    function validateForm() {
        let isValid = true;
        
        // 1. Validar Nombre
        const $nombre = $('#nombre_completo');
        if ($nombre.val().trim() === '') {
            $nombre.addClass('is-invalid');
            $('#error-nombre').show();
            isValid = false;
        } else {
            $nombre.removeClass('is-invalid').addClass('is-valid');
            $('#error-nombre').hide();
        }
        
        // 2. Validar Email
        const $email = $('#email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if ($email.val().trim() === '' || !emailRegex.test($email.val())) {
            $email.addClass('is-invalid');
            $('#error-email').show();
            isValid = false;
        } else {
            $email.removeClass('is-invalid').addClass('is-valid');
            $('#error-email').hide();
        }
        
        // 3. Validar Teléfono (Móvil de España)
        const $telefono = $('#telefono');
        const telefonoRegex = /^[67]\d{8}$/; // Empieza por 6 o 7, 9 dígitos en total
        if ($telefono.val().trim() === '' || !telefonoRegex.test($telefono.val().replace(/\s/g, ''))) {
            $telefono.addClass('is-invalid');
            $('#error-telefono').show();
            isValid = false;
        } else {
            $telefono.removeClass('is-invalid').addClass('is-valid');
            $('#error-telefono').hide();
        }
        
        // 4. Validar Mensaje
        const $mensaje = $('#mensaje');
        const msgLen = $mensaje.val().trim().length;
        if (msgLen === 0) {
            $mensaje.addClass('is-invalid');
            $('#error-mensaje').show();
            isValid = false;
        } else if (msgLen > maxLen) {
            $mensaje.addClass('is-invalid');
            $('#error-mensaje').text('El mensaje no puede exceder los 160 caracteres.').show();
            isValid = false;
        } else {
            $mensaje.removeClass('is-invalid').addClass('is-valid');
            $('#error-mensaje').hide();
        }
        
        return isValid;
    }

    function sendAjaxRequest() {
       
    }
});