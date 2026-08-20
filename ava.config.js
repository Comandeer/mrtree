const config = {
	extensions: [ 'ts' ],
	timeout: '60s',
	files: [
		'tests/**/*.{js,ts}',
		'!tests/**/{__fixtures__,__helpers__}/**'
	]
};

export default config;
