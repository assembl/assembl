// @flow
import { DraftBlockType, DraftInlineStyle } from 'draft-js';

export type ButtonConfigType = {
  icon: string,
  id: string,
  label: string,
  style?: DraftBlockType | DraftInlineStyle,
  type: 'block-type' | 'style' | 'insert-component'
};