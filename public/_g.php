<?php
define('ROOT', '/stack9/public');
define('COMMON', '/stack9/public/_common');

$segs = explode( '/', dirname($_SERVER['PHP_SELF']) );
$page = end($segs);

function page_title($path) {
	$arr = explode(DIRECTORY_SEPARATOR, $path);
	return ucfirst( end($arr) );
}
?>