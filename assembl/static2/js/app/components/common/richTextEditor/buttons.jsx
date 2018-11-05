// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { createBlockStyleButton, createInlineStyleButton } from 'draft-js-buttons';

// we need to create this intermediate component for title attribute to be translated
const DumbBoldButton = () => <span className="assembl-icon-text-bold" title={I18n.t('common.editor.bold')} />;

export const BoldButton = createInlineStyleButton({
  style: 'BOLD',
  children: <DumbBoldButton />
});

// we need to create this intermediate component for title attribute to be translated
const DumbItalicButton = () => <span className="assembl-icon-text-italics" title={I18n.t('common.editor.italic')} />;

export const ItalicButton = createInlineStyleButton({
  style: 'ITALIC',
  children: <DumbItalicButton />
});

// we need to create this intermediate component for title attribute to be translated
const DumbUnorderedListButton = () => <span className="assembl-icon-text-bullets" title={I18n.t('common.editor.bulletList')} />;

export const UnorderedListButton = createBlockStyleButton({
  blockType: 'unordered-list-item',
  children: <DumbUnorderedListButton />
});