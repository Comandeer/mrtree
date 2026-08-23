export interface ShellResultOk {
	readonly ok: true;
	readonly result: string;
}

export interface ShellResultError {
	readonly ok: false;
	readonly error: string;
}

export type ShellResult = ShellResultOk | ShellResultError;

export interface ShellExecutorOptions {
	command: string;
	args?: Array<string>;
	cwd?: string;
}

export type ShellExecutor = ( options: ShellExecutorOptions ) => Promise<ShellResult>;
