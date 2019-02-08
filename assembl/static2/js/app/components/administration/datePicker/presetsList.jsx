// @flow
import React from 'react';
import { SplitButton, MenuItem } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

type Props = {
  onSelect: Function,
  presets: Array<Preset>
};

const PresetsList = ({ onSelect, presets }: Props) => (
  <SplitButton drop="up" title="presets" id="presets-dropdown" onSelect={onSelect}>
    {presets.map(preset => (
      <MenuItem key={preset.id} eventKey={preset.range}>
        <Translate value={preset.labelTranslationKey} />
      </MenuItem>
    ))}
  </SplitButton>
);

export default PresetsList;