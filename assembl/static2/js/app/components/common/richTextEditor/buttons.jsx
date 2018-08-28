// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { createBlockStyleButton, createInlineStyleButton } from 'draft-js-buttons';

export const BoldButton = createInlineStyleButton({
  style: 'BOLD',
  children: <span className="assembl-icon-text-bold" title={I18n.t('common.editor.bold')} />
});

export const ItalicButton = createInlineStyleButton({
  style: 'ITALIC',
  children: <span className="assembl-icon-text-italics" title={I18n.t('common.editor.italic')} />
});

export const UnorderedListButton = createBlockStyleButton({
  blockType: 'unordered-list-item',
  children: <span className="assembl-icon-text-bullets" title={I18n.t('common.editor.bulletList')} />
});