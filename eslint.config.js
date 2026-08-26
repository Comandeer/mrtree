import { defineConfig } from 'eslint/config';
import { eslintConfig } from '@comandeer/eslint-config';
import { formattingConfig } from '@comandeer/eslint-config/formatting';

export default defineConfig( [
	...eslintConfig(),
	...formattingConfig(),

	{
		files: [ '**/*.{ts,cts,mts}' ],
		rules: {
			// Overriding incorrect handling of arrow in function types, e.g.
			// listWorkTrees: () => Promise<Array<string>>;
			'@stylistic/type-annotation-spacing': 'off',
			// Apparently it's broken for some reason…
			'@typescript-eslint/no-unnecessary-condition': 'off',
			// See https://github.com/Comandeer/eslint-config/issues/122
			'@stylistic/dot-location': [ 'error', 'property' ]
		}
	}
] );
