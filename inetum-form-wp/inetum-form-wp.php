<?php
/**
 * Plugin Name:       Inetum Form WP
 * Plugin URI:        https://inetum.automaworks.es/
 * Description:       Recoge los datos del formulario de contacto en una tabla de BBDD y expone un endpoint REST API (inetum-form-wp). Incluye shortcode [inetum_form_table].
 * Version:           1.1.0
 * Author:            Desarrollador Ignacio Florido
 * Author URI:        https://cv.iflorido.es/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       inetum-form-wp
 */

// Evitar acceso directo
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Constantes
define( 'INETUM_FORM_TABLE_NAME', 'inetum_datos_formulario' );

/**
 * Función que se ejecuta al activar el plugin.
 * Crea la tabla personalizada en la BBDD.
 */
function inetum_crear_tabla_en_activacion() {
    global $wpdb;
    
    // obtenemos el prefijo de la tabla y lo añadimos
    $table_name = $wpdb->prefix . INETUM_FORM_TABLE_NAME;
    
    // Charset
    $charset_collate = $wpdb->get_charset_collate();

    // Sentencia SQL para crear la tabla con los campos del formulario de la prueba
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        fecha_envio datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        nombre_completo tinytext NOT NULL,
        email varchar(100) NOT NULL,
        telefono varchar(20) NOT NULL,
        mensaje text NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    // Incluimos el fichero para usar dbDelta() y poder gestionar CRUD
    require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
    dbDelta( $sql ); 
}
register_activation_hook( __FILE__, 'inetum_crear_tabla_en_activacion' );


// Nuevo endpoint para generar un nonce propio
add_action('rest_api_init', function () {
    register_rest_route('inetum-form-wp/v1', '/nonce', [
        'methods'  => 'GET',
        'callback' => function() {
            $nonce = wp_generate_password(16, false);

            // Guardamos nonce dura 10 minutos para que no se use varias veces
            set_transient('inetum_custom_nonce', $nonce, 10 * MINUTE_IN_SECONDS);

            return [
                'nonce' => $nonce,
                'expires_in' => 600
            ];
        },
        'permission_callback' => '__return_true'
    ]);
});

/**
 * Endpoint API REST: /wp-json/inetum-form-wp/v1/submit
 */
function inetum_registrar_endpoint_api() {
    register_rest_route( 'inetum-form-wp/v1', '/submit', array(
        'methods'             => 'POST', 
        'callback'            => 'inetum_manejador_peticion_api',
        // Mantenemos __return_true ya que es una función pública
        'permission_callback' => '__return_true', 
    ) );
}
add_action( 'rest_api_init', 'inetum_registrar_endpoint_api' );


function inetum_bypass_authentication_for_public_submit( $result ) {
    // si el usuario ya está autenticado (e.g., es un admin), no hacemos nada
    if ( is_user_logged_in() ) {
        return $result;
    }

    // obtenemos la ruta REST solicitada de la variable global
    $route = isset( $GLOBALS['wp']->query_vars['rest_route'] ) ? $GLOBALS['wp']->query_vars['rest_route'] : '';
    
    // verificamos si la ruta es nuestro endpoint de envío
    if ( strpos( $route, '/inetum-form-wp/v1/submit' ) !== false ) {
        
        return true; 
    }

    return $result;
}

// Función callback que maneja la petición POST al endpoint.

function inetum_manejador_peticion_api( WP_REST_Request $request ) {
    global $wpdb;
    $table_name = $wpdb->prefix . INETUM_FORM_TABLE_NAME;

$nonce = $request->get_header('X-INETUM-SECURITY');
$saved_nonce = get_transient('inetum_custom_nonce');

if (!$saved_nonce || $nonce !== $saved_nonce) {
    return new WP_Error('nonce_invalido', 'Seguridad no válida', ['status' => 403]);
}

// Borramos nonce para eviar que se use más veces
delete_transient('inetum_custom_nonce');;
    
    // Limpiamos los datos antes de añadir a la BD
    $nombre   = sanitize_text_field( $request->get_param( 'nombre_completo' ) );
    $email    = sanitize_email( $request->get_param( 'email' ) );
    $telefono = sanitize_text_field( $request->get_param( 'telefono' ) );
    $mensaje  = sanitize_textarea_field( $request->get_param( 'mensaje' ) );

    // validación
    if ( empty($nombre) || empty($email) || !is_email($email) || empty($telefono) || empty($mensaje) ) {
        return new WP_Error( 'campos_invalidos', 'Por favor, rellena todos los campos correctamente.', array( 'status' => 400 ) );
    }
    
    // guardamos en la tabla
    $resultado = $wpdb->insert(
        $table_name,
        array(
            'fecha_envio'     => current_time( 'mysql' ),
            'nombre_completo' => $nombre,
            'email'           => $email,
            'telefono'        => $telefono,
            'mensaje'         => $mensaje,
        ),
        array(
            '%s', // fecha
            '%s', // nombre
            '%s', // email
            '%s', // telefono
            '%s', // mensaje
        )
    );

    // enviamos una respuesta tanto si da error o se ha guardado correctamente en la bd
    if ( $resultado === false ) {
        return new WP_Error( 'error_db', 'No se pudieron guardar los datos en la BBDD.', array( 'status' => 500 ) );
    }

    $response_data = array(
        'status'  => 'success',
        'message' => 'Datos recibidos y guardados correctamente en Inetum Form.',
    );
    
    return new WP_REST_Response( $response_data, 200 );
}

// Creamos un hortcode para mostrar los datos del formulario en una tabla.[inetum_form_table 
// lo añadiremos en la pagina home para la prueba
function inetum_mostrar_tabla_formulario() {
    global $wpdb;
    $table_name = $wpdb->prefix . INETUM_FORM_TABLE_NAME;

    // leemos los registros de la tabla
    $resultados = $wpdb->get_results( "SELECT * FROM $table_name ORDER BY fecha_envio DESC" );

    if ( empty( $resultados ) ) {
        return '<div class="alert alert-info">No hay registros aún.</div>';
    }

    // Creamos  la tabla con estructura Bootstrap y responsive
    $html = '<div class="table-responsive">';
    // table: clase base
    // table-striped: filas alternas
    // table-hover: efecto al pasar el ratón
    $html .= '<table class="table table-striped table-hover inetum-custom-table">';
    
    $html .= '<thead class="table-light">';
    $html .= '<tr>';
    $html .= '<th scope="col">Fecha</th>';
    $html .= '<th scope="col">Nombre</th>';
    $html .= '<th scope="col">Email</th>';
    $html .= '<th scope="col">Teléfono</th>';
    $html .= '<th scope="col">Mensaje</th>'; 
    $html .= '</tr>';
    $html .= '</thead>';
    
    $html .= '<tbody>';

    foreach ( $resultados as $fila ) {
        $html .= '<tr>';
        $html .= '<td>' . esc_html( $fila->fecha_envio ) . '</td>';
        $html .= '<td>' . esc_html( $fila->nombre_completo ) . '</td>';
        $html .= '<td>' . esc_html( $fila->email ) . '</td>';
        $html .= '<td>' . esc_html( $fila->telefono ) . '</td>';
        $html .= '<td>' . esc_html( $fila->mensaje ) . '</td>';
        $html .= '</tr>';
    }

    $html .= '</tbody>';
    $html .= '</table>';
    $html .= '</div>';

    return $html;
}
add_shortcode( 'inetum_form_table', 'inetum_mostrar_tabla_formulario' );