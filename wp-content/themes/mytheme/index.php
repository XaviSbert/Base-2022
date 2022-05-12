<?php
get_header();

while (have_posts()) :
    the_post();
    ?>
    <p></p>
<?php

endwhile;

get_footer();
?>