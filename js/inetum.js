$(document).ready(function() {

    const maxLen = 160;
    const wpApiRoot = 'https://inetum.automaworks.es/wp-json/';
    const nonceEndpoint = wpApiRoot + 'inetum-form-wp/v1/nonce';
    const submitEndpoint = wpApiRoot + 'inetum-form-wp/v1/submit';
    
    // --- registramos el modal que está maquetado en el index.html ---
    var messageModal = new bootstrap.Modal(document.getElementById('message-modal'));

    // --- Función para mostrar el mensaje en con el modal ---
    function showModalMessage(title, message) {
        $('#modal-title').text(title);
        $('#modal-message').text(message);
        messageModal.show();
    }

// añadimos una capa de seguridad extra para evitar envíos automáticos masivos.

    function initForm() {
        // Obtenemos el Nonce de WP antes de permitir el envío del formulario
        // Estado inicial de carga del Nonce, cargando seguridad y el botón desactivado
        $('#submit-button').prop('disabled', true);
        $('#submit-spinner').removeClass('d-none').addClass('d-inline-block');
        $('#nonce-status')
            .text('Cargando seguridad...')
            .prepend('<i class="bi bi-check-circle-fill status-icon"></i>')
            .removeClass('loaded')
            .addClass('loading');

        $.ajax({
            url: nonceEndpoint,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response && response.nonce) {
                    // Almacenamos el nonce en el campo oculto
                    $('#wp-nonce').val(response.nonce);
                    
                    // Cuando hemos recibido el nonce Habilitamos el botón de envío y cambiamos el estado, añadimos un pequeño retardo para mejorar la UX y un icono
                    $('#submit-button').prop('disabled', false);
                    $('#submit-spinner').removeClass('d-inline-block').addClass('d-none');
                    $('#nonce-status').text('Seguridad cargada.');
                    setTimeout(() => {
                        $('#nonce-status')
                            .contents().filter(function() { return this.nodeType === 3; }).remove(); // borramos texto previo
                        $('#nonce-status').append(' Seguridad cargada.');
                        $('#nonce-status')
                        .removeClass('loading')
                        .prepend('<i class="bi bi-check-circle-fill status-icon"></i>')
                        .addClass('loaded');
                        
                    }, 1500);
                    $('#submit-button').text('Enviar Mensaje');
                } else {
                    $('#nonce-status').text('Error de seguridad. Recarga la página.');
                    showModalMessage('Error de Inicialización', 'No se pudo obtener el código de seguridad (Nonce).');
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                let status = jqXHR.status;
                let errorType = "de Servidor/PHP";

                if (status === 0) {
                    errorType = "de Red o CORS";
                }
                
                $('#nonce-status').text(`Error ${status} - ${errorType}`);
                showModalMessage('Error de Conexión', `No se pudo contactar con la API de WordPress para cargar la seguridad. Código: ${status}. Por favor, verifica la consola del navegador.`);
                
                console.error("Fallo al cargar Nonce:", {status, textStatus, errorThrown, response: jqXHR.responseText});
                
                // habilitamos el botón en caso de fallo de conexión para no dejarlo atascado
                $('#submit-button').prop('disabled', false);
                $('#submit-spinner').removeClass('d-inline-block').addClass('d-none');
            }
        });
    }

    // Requisitos de la prueba técnica Inetum //
    // --- contador de caracteres  ---
 
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

    // --- validación y envío AJAX  ---
    $('#contact-form').on('submit', function(e) {
        e.preventDefault(); // evitar envío normal
        
        if (validateForm()) {
            // formulario válido, envamos con AJAX
            sendAjaxRequest();
        }
    });

    function validateForm() {
        let isValid = true;
        
        // validar Nombre
        const $nombre = $('#nombre_completo');
        if ($nombre.val().trim() === '') {
            $nombre.addClass('is-invalid');
            $('#error-nombre').show();
            isValid = false;
        } else {
            $nombre.removeClass('is-invalid').addClass('is-valid');
            $('#error-nombre').hide();
        }
        
        // validar Email
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
        
        // validar teléfono 
        const $telefono = $('#telefono');
        const telefonoRegex = /^[67]\d{8}$/; // empieza por 6 o 7, 9 dígitos en total
        if ($telefono.val().trim() === '' || !telefonoRegex.test($telefono.val().replace(/\s/g, ''))) {
            $telefono.addClass('is-invalid');
            $('#error-telefono').show();
            isValid = false;
        } else {
            $telefono.removeClass('is-invalid').addClass('is-valid');
            $('#error-telefono').hide();
        }
        
        // validar mensaje
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
        // estado de carga
        const $submitButton = $('#submit-button');
        const $submitSpinner = $('#submit-spinner');
        
        $submitButton.prop('disabled', true);
        $submitSpinner.removeClass('d-none').addClass('d-inline-block');
        // obtenemos el nonce del campo oculto
        const nonceValue = $('#wp-nonce').val(); // o inetum-nonce
        
        const formData = {
            nombre_completo: $('#nombre_completo').val(),
            email: $('#email').val(),
            telefono: $('#telefono').val(),
            mensaje: $('#mensaje').val()
        };
        
        // URL del endpoint REST API de WordPress (Plugin Inetum Form WP)
        // Cambiamos el enviar directamente la URL aquí y lo hacemos con la varriable wpApiRoot + submitEndpoint
        //const postUrl_WP = 'https://inetum.automaworks.es/wp-json/inetum-form-wp/v1/submit';
        
        $.ajax({
            type: 'POST',
            url: submitEndpoint,
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',

            // enviar nonce solo aquí
            headers: {
                'X-INETUM-SECURITY': nonceValue
            },

            success: function(response) {
                showModalMessage('¡Enviado!', 'Gracias por tu mensaje. Nos pondremos en contacto contigo pronto.');
                
                $('#contact-form')[0].reset();
                $('.form-control').removeClass('is-valid');
                $('#char-counter').text('160 caracteres restantes');

                // regenerar nonce e incializar formulario de nuevo
                initForm();
            },
            error: function(jqXHR) {
                let errorMsg = 'Hubo un problema al enviar tu mensaje. Inténtalo de nuevo más tarde.';
                
                if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                    errorMsg = 'Error: ' + jqXHR.responseJSON.message;
                } else if (jqXHR.status === 403) {
                    errorMsg = 'Error de seguridad 403. El código de seguridad ha expirado. Recargando...';
                    initForm();
                }

                showModalMessage('Error', errorMsg);
                console.error('Error AJAX:', jqXHR.status, jqXHR.responseJSON);
            },
            complete: function(jqXHR) {
                if (jqXHR.status !== 200 && jqXHR.status !== 403) {
                    $submitButton.prop('disabled', false);
                    $submitSpinner.removeClass('d-inline-block').addClass('d-none');
                }
            }
        });
    }
    // Llamamos a la función de inicialización al cargar la página
    initForm();
});