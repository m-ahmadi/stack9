let $$, temps;

function init () {
	$$ = __els('[root="comp1"]');
	temps = __temps('comp1');
	
	$$.say.on('click', function () {
		$$.msg.text( $$.msgSrc.val() );
	});
}

export default { init }