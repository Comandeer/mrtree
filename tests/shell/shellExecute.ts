import { resolve as resolvePath } from 'node:path';
import test from 'ava';
import { shellExecute } from '../../src/shell/shellExecute.ts';
import type { ShellExecutorOptions, ShellResult, ShellResultError, ShellResultOk } from '../../src/shell/ShellExecutor.ts';

const fixtureDir = resolvePath( import.meta.dirname, '../__fixtures__/shell' );
const expectedMessage = 'hublabubla\n';

test( 'it returns the result of the command as a string', async ( t ) => {
	const expectedResult: ShellResultOk = {
		ok: true,
		result: expectedMessage
	};
	const result = await shellExecute( createTestCommand( 'ok' ) );

	t.deepEqual( result, expectedResult );
} );

test( 'it returns the stderr of failed command as a string', async ( t ) => {
	const result = await shellExecute( createTestCommand( 'error' ) );

	t.true( isErrorResult( result ) );
	t.true( ( result as ShellResultError ).error.includes( expectedMessage ) );
} );

function createTestCommand( fixtureName: string ): ShellExecutorOptions {
	const fixtureFileName = `${ fixtureName }.js`;
	const fixturePath = resolvePath( fixtureDir, fixtureFileName );

	return {
		command: 'node',
		args: [ fixturePath ],
		cwd: import.meta.dirname
	};
}

function isErrorResult( result: ShellResult ): result is ShellResultError {
	return !result.ok;
}
