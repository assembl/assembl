// @flow
import { EditorState } from 'draft-js';

export type I18nValue = { [string]: string };
export type I18nRichTextValue = { [string]: EditorState };

// file value for storage in react-final-form state
export type FileValue = null | string | StrictFile;

// file variable sent to mutations
export type FileVariable = null | 'TO_DELETE' | File;

export type MutationsPromises = Array<() => Promise<*>>;

export type SaveStatus = 'OK' | 'KO' | 'PENDING';