#!/usr/bin/env node

import { cwd } from 'node:process';
import { ShellGitAPI } from '../git/ShellGitAPI.ts';
import { shellExecute } from '../shell/shellExecute.ts';

const gitAPI = new ShellGitAPI( {
	shellExecutor: shellExecute
} );

console.log( await gitAPI.getWorkTree( {
	path: cwd()
} ) );
