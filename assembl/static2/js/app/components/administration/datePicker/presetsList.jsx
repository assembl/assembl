// @flow
import React from 'react';
import { SplitButton, MenuItem } from 'react-bootstrap';
import { type moment } from 'moment';

type Range = {
  start: moment,
  end: moment
};

type Preset = {
  id: string,
  range: Range,
  label: string
};

type Props = {
  onSelect: Function,
  presets: Array<Preset> // TODO: more details
};

const PresetsList = ({ onSelect, presets }: Props) => (
  <SplitButton drop="up" title="presets" id="presets-dropdown" onSelect={onSelect}>
    {presets.map(preset => (
      <MenuItem key={preset.id} eventKey={preset.range}>
        {preset.label}
      </MenuItem>
    ))}
  </SplitButton>
);

export default PresetsList;