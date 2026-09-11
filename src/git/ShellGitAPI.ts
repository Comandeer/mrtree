import type { ShellExecutor } from '../shell/ShellExecutor.ts';
import type { GitAPI, GitGetRepoRootOptions, GitGetWorkTreeByBranchOptions, GitGetWorkTreeByPathOptions, GitListWorkTreesOptions, GitRemoveWorkTreeOptions, GitWorkTree } from './GitAPI.ts';

export interface ShellGitAPIOptions {
	shellExecutor: ShellExecutor;
}

export class ShellGitAPI implements GitAPI {
	#shellExecutor: ShellExecutor;

	constructor( { shellExecutor }: ShellGitAPIOptions ) {
		this.#shellExecutor = shellExecutor;
	}

	// addWorkTree( options: GitAddWorkTreeOptions ): Promise<string>;

	async removeWorkTree( { path, branch }: GitRemoveWorkTreeOptions ): Promise<boolean> {
		const workTree = branch !== undefined ? await this.getWorkTreeByBranch( { branch, path } ) : await this.getWorkTreeByPath( { path } );

		if ( workTree === undefined ) {
			return false;
		}
		const workTreeRemoval = await this.#shellExecutor( {
			command: 'git',
			args: [
				'worktree',
				'remove',
				'--force',
				workTree.path
			]
		} );

		if ( !workTreeRemoval.ok ) {
			throw new Error( `Can't remove worktree at ${ path } path` );
		}

		await this.#shellExecutor( {
			command: 'git',
			args: [
				'worktree',
				'prune'
			]
		} );

		await this.#shellExecutor( {
			command: 'git',
			args: [
				'branch',
				'-D',
				'--quiet',
				workTree.branch
			]
		} );

		return true;
	}

	async listWorkTrees( { path }: GitListWorkTreesOptions ): Promise<Array<GitWorkTree>> {
		return this.#getWorkTrees( path );
	}

	async getWorkTreeByBranch( { path, branch }: GitGetWorkTreeByBranchOptions ): Promise<GitWorkTree | undefined> {
		const workTrees = await this.#getWorkTrees( path );
		const workTree = workTrees.find( ( workTree ) => {
			return workTree.branch === branch;
		} );

		return workTree;
	}

	async getWorkTreeByPath( { path }: GitGetWorkTreeByPathOptions ): Promise<GitWorkTree | undefined> {
		const root = await this.#getWorkTreeRoot( path );

		if ( root === undefined ) {
			return undefined;
		}

		const workTrees = await this.#getWorkTrees( root );
		const workTree = workTrees.find( ( { path } ) => {
			return path === root;
		} );

		return workTree;
	}

	async getRepoRoot( { path }: GitGetRepoRootOptions ): Promise<string> {
		const workTrees = await this.#getWorkTrees( path );
		const mainWorkTree = workTrees.at( 0 );

		if ( mainWorkTree === undefined ) {
			throw new Error( `Can't get repo root for ${ path } path` );
		}

		return mainWorkTree.path;
	}

	async #getWorkTrees( path: string ): Promise<Array<GitWorkTree>> {
		const rawWorkTrees = await this.#shellExecutor( {
			command: 'git',
			args: [
				'worktree',
				'list',
				'--porcelain'
			],
			cwd: path
		} );

		if ( !rawWorkTrees.ok ) {
			throw new Error( `Can't get list of worktrees for ${ path } path` );
		}

		const parsedWorkTrees = rawWorkTrees.result
			.split( '\n\n' )
			.map( parseWorkTreeRecord )
			.filter( ( value: GitWorkTree | undefined ): value is GitWorkTree => {
				return value !== undefined;
			} );

		return parsedWorkTrees;
	}

	async #getWorkTreeRoot( path: string ): Promise<string | undefined> {
		const repoMetadata = await this.#shellExecutor( {
			command: 'git',
			args: [
				'rev-parse',
				'--path-format=absolute',
				'--show-toplevel'
			],
			cwd: path
		} );

		if ( !repoMetadata.ok ) {
			return undefined;
		}

		const [ topLevel ] = repoMetadata.result
			.split( '\n' )
			.map( ( path ) => {
				return path.trim();
			} );

		if ( isEmptyStringOrNonExistent( topLevel ) ) {
			return undefined;
		}

		return topLevel;
	}
}

function isEmptyStringOrNonExistent( value: undefined | string ): value is undefined {
	if ( value === undefined ) {
		return true;
	}

	return value.trim().length === 0;
}

const WORKTREE_PATH_REGEX = /^worktree /v;
const WORKTREE_HEAD_REGEX = /^HEAD /v;
const WORKTREE_BRANCH_REGEX = /^branch refs\/heads\//v;

function parseWorkTreeRecord( record: string ): GitWorkTree | undefined {
	const [ rawPath, rawHead, rawBranch ] = record.split( '\n' );

	if ( rawPath === undefined || rawHead === undefined || rawBranch === undefined ) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
	if ( !WORKTREE_PATH_REGEX.test( rawPath ) || !WORKTREE_HEAD_REGEX.test( rawHead ) || !WORKTREE_BRANCH_REGEX.test( rawBranch ) ) {
		return undefined;
	}

	const path = rawPath.replace( WORKTREE_PATH_REGEX, '' ).trim();
	const head = rawHead.replace( WORKTREE_HEAD_REGEX, '' ).trim();
	const branch = rawBranch.replace( WORKTREE_BRANCH_REGEX, '' ).trim();

	return {
		path,
		head,
		branch
	};
}
