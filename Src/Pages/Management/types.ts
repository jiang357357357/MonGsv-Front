export interface VersionInfo {
	name: string;
	source: 'enum' | 'dir' | 'db';
	isDefault?: boolean;
	isCurrent?: boolean;
}

export interface WorldInfo {
	id: number;
	name: string;
	description?: string;
	version?: string | null;
}

export interface ModelInfo {
	id: number;
	name: string;
	path?: string;
	version?: string;
}

export interface RoleInfo {
	id: number;
	name: string;
	world_id?: number | null;
	world_name?: string | null;
	version?: string | null;
	gpt_model_id?: number | null;
	gpt_model_name?: string | null;
	gpt_model_path?: string | null;
	sov_model_id?: number | null;
	sov_model_name?: string | null;
	sov_model_path?: string | null;
	gpt_model?: ModelInfo | null;
	sov_model?: ModelInfo | null;
	prompt_text?: string | null;
	prompt_audio_path?: string | null;
	language?: string;
	created_at?: string;
	updated_at?: string;
}

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
