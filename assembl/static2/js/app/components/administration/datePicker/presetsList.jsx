// @flow
import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { type moment } from 'moment';
import Dropdown from '../../styleguide/dropdown';

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
  <DropdownButton drop="up" title="presets" id="presets-dropdown" onSelect={onSelect}>
    {presets.map((preset, index) => <Dropdown.Item eventKey={index}>{index}</Dropdown.Item>)}
  </DropdownButton>
);

export default PresetsList;