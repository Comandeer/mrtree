import test from 'ava';
import { createTestShellExecutor } from '../__helpers__/createTestShellExecutor.ts';
import { ShellGitAPI } from '../../src/git/ShellGitAPI.ts';
import type { GitWorkTree } from '../../src/git/GitAPI.ts';
import type { ShellResult } from '../../src/shell/ShellExecutor.ts';

const SAMPLE_ROOT_PATH = '/home/mrtree/repo';
const SAMPLE_WORKTREE_PATH = '/home/mrtree/repo-worktree/worktree-1';
const SAMPLE_ROOT_BRANCH = 'main';
const SAMPLE_WORKTREE_BRANCH = 'worktree-1';
const SAMPLE_ROOT_HEAD = generateHeadHash( 0 );
const SAMPLE_WORKTREE_HEAD = generateHeadHash( 1 );
const SAMPLE_WORKTREE_LIST_OUTPUT = `worktree ${ SAMPLE_ROOT_PATH }
HEAD ${ SAMPLE_ROOT_HEAD }
branch refs/heads/${ SAMPLE_ROOT_BRANCH }

worktree ${ SAMPLE_WORKTREE_PATH }
HEAD ${ SAMPLE_WORKTREE_HEAD }
branch refs/heads/${ SAMPLE_WORKTREE_BRANCH }

`;
const SAMPLE_ROOT_METADATA: GitWorkTree = {
	path: SAMPLE_ROOT_PATH,
	head: SAMPLE_ROOT_HEAD,
	branch: SAMPLE_ROOT_BRANCH
};
const SAMPLE_WORKTREE_METADATA: GitWorkTree = {
	path: SAMPLE_WORKTREE_PATH,
	head: SAMPLE_WORKTREE_HEAD,
	branch: SAMPLE_WORKTREE_BRANCH
};

test( '#removeWorkTree() removes worktree by its path', async ( t ) => {
	const shellExecutorConfig: Record<string, ShellResult> = {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: true,
			result: SAMPLE_WORKTREE_PATH
		},

		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		},

		[ `git worktree remove --force ${ SAMPLE_WORKTREE_PATH }` ]: {
			ok: true,
			result: ''
		},

		'git worktree prune': {
			ok: true,
			result: ''
		},

		[ `git branch -D --quiet ${ SAMPLE_WORKTREE_BRANCH }` ]: {
			ok: true,
			result: ''
		}
	};
	const expectedCommands = Object.keys( shellExecutorConfig );
	const { shellExecutor, calls } = createTestShellExecutor( shellExecutorConfig );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.removeWorkTree( { path: SAMPLE_WORKTREE_PATH } );
	const calledCommands = calls.map( ( { command } ) => {
		return command;
	} );

	t.true( result );
	t.deepEqual( calledCommands, expectedCommands );
} );

test( '#removeWorkTree() removes worktree by its branch', async ( t ) => {
	const shellExecutorConfig: Record<string, ShellResult> = {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		},

		[ `git worktree remove --force ${ SAMPLE_WORKTREE_PATH }` ]: {
			ok: true,
			result: ''
		},

		'git worktree prune': {
			ok: true,
			result: ''
		},

		[ `git branch -D --quiet ${ SAMPLE_WORKTREE_BRANCH }` ]: {
			ok: true,
			result: ''
		}
	};
	const expectedCommands = Object.keys( shellExecutorConfig );
	const { shellExecutor, calls } = createTestShellExecutor( shellExecutorConfig );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.removeWorkTree( {
		path: SAMPLE_ROOT_PATH,
		branch: SAMPLE_WORKTREE_BRANCH
	} );
	const calledCommands = calls.map( ( { command } ) => {
		return command;
	} );

	t.true( result );
	t.deepEqual( calledCommands, expectedCommands );
} );

test( '#removeWorkTree() does not remove the worktree by path if there is no git repository at given path', async ( t ) => {
	const shellExecutorConfig: Record<string, ShellResult> =  {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: false,
			error: 'fatal: not a git repository'
		}
	};
	const expectedCommands = Object.keys( shellExecutorConfig );
	const { shellExecutor, calls } = createTestShellExecutor( shellExecutorConfig );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.removeWorkTree( { path: '/hublabubla' } );
	const calledCommands = calls.map( ( { command } ) => {
		return command;
	} );

	t.false( result );
	t.deepEqual( calledCommands, expectedCommands );
} );

test( '#listWorkTrees() returns array with info on each of worktrees', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.listWorkTrees( { path: SAMPLE_ROOT_PATH } );
	const expectedResult: Array<GitWorkTree> = [
		SAMPLE_ROOT_METADATA,
		SAMPLE_WORKTREE_METADATA
	];

	t.deepEqual( result, expectedResult );
} );

test( '#listWorkTrees() ignores incorrect worktree records', async ( t ) => {
	const gitWorktreeListOutput = `${ SAMPLE_WORKTREE_LIST_OUTPUT }

worktree /some/path`;
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: gitWorktreeListOutput
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.listWorkTrees( { path: SAMPLE_ROOT_PATH } );
	const expectedResult: Array<GitWorkTree> = [
		SAMPLE_ROOT_METADATA,
		SAMPLE_WORKTREE_METADATA
	];

	t.deepEqual( result, expectedResult );
} );

test( '#listWorkTrees() throws if command fails', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: false,
			error: 'fatal: not a git repository'
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const resultPromise = gitAPI.listWorkTrees( { path: SAMPLE_ROOT_PATH } );

	await t.throwsAsync( resultPromise );
} );

test( '#getWorkTreeByBranch() returns worktree metadata for a given branch', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getWorkTreeByBranch( {
		path: SAMPLE_ROOT_PATH,
		branch: SAMPLE_WORKTREE_BRANCH
	} );

	t.deepEqual( result, SAMPLE_WORKTREE_METADATA );
} );

test( '#getWorkTreeByBranch() returns undefined if a worktree does not exist for a given branch', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getWorkTreeByBranch( {
		path: SAMPLE_ROOT_PATH,
		branch: 'hublabubla'
	} );

	t.is( result, undefined );
} );

test( '#getWorkTreeByPath() returns metadata for the main worktree if called in the main worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: true,
			result: SAMPLE_ROOT_PATH
		},
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getWorkTreeByPath( { path: SAMPLE_ROOT_PATH } );

	t.deepEqual( result, SAMPLE_ROOT_METADATA );
} );

test( '#getWorkTreeByPath() returns metadata for the main worktree if called in the subdirectory of the main worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: true,
			result: SAMPLE_ROOT_PATH
		},
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const subdirPath = `${ SAMPLE_ROOT_PATH }/some-subdir`;
	const result = await gitAPI.getWorkTreeByPath( { path: subdirPath } );

	t.deepEqual( result, SAMPLE_ROOT_METADATA );
} );

test( '#getWorkTreeByPath() returns worktree metadata if called in a worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: true,
			result: SAMPLE_WORKTREE_PATH
		},
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getWorkTreeByPath( { path: SAMPLE_WORKTREE_PATH } );

	t.deepEqual( result, SAMPLE_WORKTREE_METADATA );
} );

test( '#getWorkTreeByPath() returns worktree metadata if called in the subdirectory of a worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: true,
			result: SAMPLE_WORKTREE_PATH
		},
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const subdirPath = `${ SAMPLE_WORKTREE_PATH }/some-subdir`;
	const result = await gitAPI.getWorkTreeByPath( { path: subdirPath } );

	t.deepEqual( result, SAMPLE_WORKTREE_METADATA );
} );

test( '#getWorkTreeByPath() returns undefined if the command fails', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git rev-parse --path-format=absolute --show-toplevel': {
			ok: false,
			error: 'fatal: not a git repository'
		},
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getWorkTreeByPath( { path: SAMPLE_ROOT_PATH } );

	t.is( result, undefined );
} );

test( '#getRepoRoot() returns path to the repo root directory if called in the main worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getRepoRoot( { path: SAMPLE_ROOT_PATH } );

	t.is( result, SAMPLE_ROOT_PATH );
} );

test( '#getRepoRoot() returns path to the repo root directory if called in a worktree', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: SAMPLE_WORKTREE_LIST_OUTPUT
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const result = await gitAPI.getRepoRoot( { path: SAMPLE_WORKTREE_PATH } );

	t.is( result, SAMPLE_ROOT_PATH );
} );

test( '#getRepoRoot() throws if the command result is incorrect', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: true,
			result: ''
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const resultPromise = gitAPI.getRepoRoot( { path: SAMPLE_ROOT_PATH } );

	await t.throwsAsync( resultPromise );
} );

test( '#getRepoRoot() throws if command fails', async ( t ) => {
	const { shellExecutor } = createTestShellExecutor( {
		'git worktree list --porcelain': {
			ok: false,
			error: 'fatal: not a git repository'
		}
	} );
	const gitAPI = new ShellGitAPI( { shellExecutor } );
	const resultPromise = gitAPI.getRepoRoot( { path: SAMPLE_ROOT_PATH } );

	await t.throwsAsync( resultPromise );
} );

function generateHeadHash( i: number ): string {
	return String( i ).repeat( 40 );
}
