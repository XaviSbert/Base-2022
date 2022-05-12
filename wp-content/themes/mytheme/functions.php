<?php
function mitheme_files()
{

    wp_enqueue_script('THEME-js', get_theme_file_uri('/js/script.js'), ['jquery'], '1.0', true);
    wp_enqueue_style('THEME', get_theme_file_uri('/css/style.css'));
}

add_action('wp_enqueue_scripts', 'THEME_files');

function mitheme_features()
{
    $supports = [
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ];
    add_theme_support('html5', $supports);

    //
    register_nav_menu('main-menu', __('Menu Principal'));

    // Soporte para etiqueta <title> dentro de <head>
    add_theme_support('title-tag');

    // Soporte para imágenes destacadas
    add_theme_support('post-thumbnails');

    // Soporte para Feed automático para posts y comentarios
    add_theme_support('automatic-feed-links');

    // Anchura del contenido. Sirve especialmente para vídeos embebidos.
    $GLOBALS['content_width'] = 1280;

    // Soporte para internacionalización
    load_theme_textdomain('THEME', get_template_directory() . '/languages');

}

add_action('after_setup_theme', 'THEME_features');

/* Permitir subir archivos .svg */
function add_svg_to_upload_mimes($upload_mimes)
{
    $upload_mimes['svg'] = 'image/svg+xml';
    $upload_mimes['svgz'] = 'image/svg+xml';
    return $upload_mimes;
}

add_filter('upload_mimes', 'add_svg_to_upload_mimes', 10, 1);

function my_login_logo() { ?>
    <style type="text/css">
        #login h1 a, .login h1 a {
            background-image: url(<?php echo get_stylesheet_directory_uri(); ?>/img/my-logo.svg);
            height:150px;
            width:266px;
            background-size: 266px 150px;
            background-repeat: no-repeat;
            padding-bottom: 30px;
        }
    </style>
<?php }
add_action( 'login_enqueue_scripts', 'my_login_logo' );

function my_login_logo_url() {
    return home_url();
}
add_filter( 'login_headerurl', 'my_login_logo_url' );

function my_login_logo_url_title() {
    return 'THEME title';
}
add_filter( 'login_headertext', 'my_login_logo_url_title' );