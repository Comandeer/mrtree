import { defineConfig } from 'eslint/config';
import { eslintConfig } from '@comandeer/eslint-config';
import { formattingConfig } from '@comandeer/eslint-config/formatting';

export default defineConfig( [
	...eslintConfig(),
	...formattingConfig(),

	// Overriding incorrect handling of arrow in function types, e.g.
	// listWorkTrees: () => Promise<Array<string>>;
	{
		files: [ '**/*.{ts,cts,mts}' ],
		rules: {
			'@stylistic/type-annotation-spacing': 'off'
		}
	}
] );
