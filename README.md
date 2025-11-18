# inetum
Prueba técnica Desarrollador WP-PHP- Bootstrap-JS

# Explicación de la Prueba Técnica

Este proyecto cumple con los 4 requisitos de la prueba técnica y mejoras significativas en la arquitectura del código (archivos externos para CSS y JS) y en la gestión de datos con WordPress.

### 1. Página de Precios (Bootstrap)

Se ha replicado la estructura del documento utilizando Bootstrap 5.3 para el layout (navbar, grid de tarjetas, tabla responsiva, footer).

### 2. Estilo con SASS/Less (Simulado)

Implementación Profesional:
Se utiliza un archivo SASS externo (styles.scss) que debe ser compilado a CSS.

Archivo fuente: styles.scss (contiene variables, anidación, etc.).

Compilación: sass styles.scss:styles.css.

Vinculación: El HTML enlaza al archivo compilado <link rel="stylesheet" href="styles.css">

### 3. Formulario HTML, Validación jQuery y AJAX

Mejora de Organización:
Todo el código JavaScript se ha extraído a un archivo externo inetum.js para mantener el HTML limpio y separar responsabilidades.

Archivo: js/inetum.js

## Funcionalidades:

Validación (jQuery):

Campos obligatorios: nombre, email, telefono, mensaje.

Email válido: Regex estándar.

Teléfono de España: Valida 9 dígitos empezando por 6 o 7.

Contador de Mensaje: Actualización dinámica de caracteres restantes.

Feedback: Uso de Modal de Bootstrap en lugar de alert().

Envío AJAX: Envía los datos mediante POST al endpoint REST de WordPress.

### 4. Plugin de WordPress: Inetum Form WP

El archivo inetum-form-wp.php es un plugin de WordPress funcional.

#### Nombre del Plugin: Inetum Form WP

### Funcionalidad:

Crea una tabla en la base de datos (wp_inetum_datos_formulario) al activarse.

Registra un endpoint API REST: /wp-json/inetum-form-wp/v1/submit.

Recibe, sanea, valida y guarda los datos enviados por el formulario.

Devuelve respuestas JSON adecuadas para que el frontend (main.js) las procese.

#### Plugin instalado en https://inetum.automaworks.es/

#### Prueba de maquetación en https://inetum.automaworks.es/inetumtecnica/ 