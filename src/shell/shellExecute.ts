import { execSync, type ExecSyncOptionsWithBufferEncoding, type SpawnSyncReturns } from 'node:child_process';
import type { ShellExecutorOptions, ShellResult } from './ShellExecutor.ts';

export function shellExecute( options: ShellExecutorOptions ): Promise<ShellResult> {
	try {
		const command = prepareCommand( options );
		const execOptions = prepareOptions( options );
		const result = execSync( command, execOptions );
		const resultAsString = result.toString( 'utf-8' );

		return Promise.resolve( {
			ok: true,
			result: resultAsString
		} );
	} catch ( error ) {
		if ( !isSpawnResult( error ) ) {
			throw error;
		}

		const errorAsString = error.stderr.toString( 'utf-8' );

		return Promise.resolve( {
			ok: false,
			error: errorAsString
		} );
	}
}

function prepareCommand( { command, args = [] }: ShellExecutorOptions ): string {
	return [ command, ...args ].join( ' ' );
}

function prepareOptions( options: ShellExecutorOptions ): ExecSyncOptionsWithBufferEncoding {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { command, args, ...filteredOptions } = options;

	return {
		...filteredOptions,
		stdio: 'pipe'
	};
}

function isSpawnResult( value: unknown ): value is SpawnSyncReturns<Buffer | string> {
	return typeof value === 'object' && value !== null && 'stderr' in value;
}
