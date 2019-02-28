// @flow
import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

type Props = {
  onPresetSelect: Function,
  presets: Array<Preset>,
  selectedPreset: ?Preset
};

const PresetsList = ({ onPresetSelect, presets, selectedPreset }: Props) => {
  const selectedPresetPlaceHolder = I18n.t('administration.export.presets.placeHolder');
  const selectedPhaseNumber = selectedPreset && selectedPreset.type === 'phase' ? selectedPreset.id : null;
  return (
    <DropdownButton
      drop="up"
      title={
        selectedPreset ? I18n.t(selectedPreset.labelTranslationKey, { count: selectedPhaseNumber }) : selectedPresetPlaceHolder
      }
      id="presets-dropdown"
      onSelect={onPresetSelect}
    >
      {presets.map((preset) => {
        const isPhase = preset.type === 'phase';
        return (
          <MenuItem key={preset.id} eventKey={preset}>
            <Translate value={preset.labelTranslationKey} count={isPhase ? preset.id : null} />
          </MenuItem>
        );
      })}
    </DropdownButton>
  );
};

export default PresetsList;