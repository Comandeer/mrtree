import type { ShellExecutor, ShellExecutorOptions, ShellResult } from '../../src/shell/ShellExecutor.ts';

interface Call {
	readonly command: string;
	readonly result: ShellResult;
}

interface TestShellExecutor {
	readonly shellExecutor: ShellExecutor;
	readonly calls: Array<Call>;
}

export function createTestShellExecutor( results: Record<string, ShellResult> ): TestShellExecutor {
	const calls: Array<Call> = [];
	const shellExecutor = async ( { command, args = [] }: ShellExecutorOptions ): Promise<ShellResult> =>  {
		const fullCommand = [ command, ...args ].join( ' ' );
		const result = results[ fullCommand ];

		if ( result === undefined ) {
			throw new Error( `No result for the ${ fullCommand } command` );
		}

		calls.push( {
			command: fullCommand,
			result
		} );

		return result;
	};

	return {
		shellExecutor,
		calls
	};
}
