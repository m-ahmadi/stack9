function __temps(name='') {
	const res = {};
	Object.keys(_templates)
		.filter( i => new RegExp(name).test(i) )
		.forEach( i => res[i.replace(name+'/', '')] = _templates[i] );
	return res;
}

function __els(root=document, obj, overwrite=false) {
	if (typeof root === 'string') root = $(root); // document.querySelector(root)
	if (!root) return;
	const res = {};
	const el = $('[ref]', root);    // root.querySelectorAll('[ref]')
	const els = $ ('[refs]', root); // root.querySelectorAll('[refs]');
	[...el].forEach(i => res[ i.attributes.ref.value ] = $(i)); // i
	[...els].forEach(i => {
		i.attributes.refs.value.split(' ').forEach(k => {
			if (!res[k]) res[k] = $(); // []
			res[k] = res[k].add(i);    // res[k].push(i)
		});
	});
	res.root = root; // $(root)
	if (obj) {
		Object.keys(res).forEach(k => {
			if (!obj[k] || overwrite) obj[k] = res[k];
		});
	} else {
		return res;
	}
}