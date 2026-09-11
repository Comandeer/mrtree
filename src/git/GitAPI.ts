export interface GitAddWorkTreeOptions {
	readonly path: string;
	readonly workTreeRootPath: string;
	readonly branch: string;
	readonly baseBranch?: string;
}

export interface GitRemoveWorkTreeOptions {
	readonly path: string;
	readonly branch?: string;
}

export interface GitListWorkTreesOptions {
	readonly path: string;
}

export interface GitWorkTree {
	readonly branch: string;
	readonly head: string;
	readonly path: string;
}

export interface GitGetBranchTypeOptions {
	readonly path: string;
	readonly branch: string;
}

export type GitBranchType = 'remote' | 'local' | 'none';

export interface GitGetRepoRootOptions {
	readonly path: string;
}

export interface GitGetWorkTreeByBranchOptions {
	readonly path: string;
	readonly branch: string;
}

export interface GitGetWorkTreeByPathOptions {
	readonly path: string;
}

export interface GitAPI {
	// addWorkTree: ( options: GitAddWorkTreeOptions ) => Promise<GitWorkTree>;
	removeWorkTree: ( options: GitRemoveWorkTreeOptions ) => Promise<boolean>;
	listWorkTrees: ( options: GitListWorkTreesOptions ) => Promise<Array<GitWorkTree>>;
	getRepoRoot: ( options: GitGetRepoRootOptions ) => Promise<string>;
	getWorkTreeByBranch: ( options: GitGetWorkTreeByBranchOptions ) => Promise<GitWorkTree | undefined>;
	getWorkTreeByPath: ( options: GitGetWorkTreeByPathOptions ) => Promise<GitWorkTree | undefined>;
}
