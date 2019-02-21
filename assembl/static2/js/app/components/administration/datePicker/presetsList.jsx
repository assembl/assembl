// @flow
import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

type Props = {
  onSelect: Function,
  presets: Array<Preset>
};

type State = {
  selectedPreset: ?string,
  selectedPhaseNumber: ?string | number
};

class PresetsList extends React.PureComponent<Props, State> {
  state = {
    selectedPreset: null,
    selectedPhaseNumber: null
  };

  handlePresetSelect = (preset: Preset) => {
    const { type, labelTranslationKey, id } = preset;
    const isPhase = type === 'phase';
    this.props.onSelect(preset);
    this.setState({ selectedPreset: labelTranslationKey, selectedPhaseNumber: isPhase ? id : null });
  };

  render() {
    const { presets } = this.props;
    const selectedPresetPlaceHolder = I18n.t('administration.export.presets.placeHolder');
    const { selectedPreset, selectedPhaseNumber } = this.state;
    return (
      <DropdownButton
        drop="up"
        title={selectedPreset ? I18n.t(selectedPreset, { count: selectedPhaseNumber }) : selectedPresetPlaceHolder}
        id="presets-dropdown"
        onSelect={this.handlePresetSelect}
      >
        {presets.map((preset) => {
          const isPhase = preset.labelTranslationKey === 'administration.export.presets.phase';
          return (
            <MenuItem key={preset.id} eventKey={preset}>
              <Translate value={preset.labelTranslationKey} count={isPhase ? preset.id : null} />
            </MenuItem>
          );
        })}
      </DropdownButton>
    );
  }
}

export default PresetsList;