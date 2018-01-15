// @flow
import React from 'react';
import { connect } from 'react-redux';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import ColorPicker from '../../common/colorPicker';
import { updateTokenColor } from '../../../actions/adminActions/voteSession';

const TokenTypeForm = ({ title, color, number, handleColorChange }) => {
  const handleTitleChange = () => {};
  const handleNumberChange = () => {};

  const pickerColors = [
    '#FF6900',
    '#FCB900',
    '#8646ED',
    '#FF82BE',
    '#1652C1',
    '#00DCFF',
    '#00AA7B',
    '#EB144C',
    '#B8E986',
    '#000000'
  ];

  return (
    <div>
      <FormControlWithLabel
        label="Intitulé du jeton" // TODO ajouter une key dans le fichier de trad
        required
        type="text"
        onChange={handleTitleChange}
        value={title}
      />
      <FormControlWithLabel
        label="Nombre de jeton" // TODO ajouter une key dans le fichier de trad
        required
        type="text"
        onChange={handleNumberChange}
        value={number}
      />
      <FormControlWithLabel
        label="Couleur du jeton" // TODO ajouter une key dans le fichier de trad
        required
        type="text"
        onChange={handleColorChange}
        value={color}
      />
      <ColorPicker colors={pickerColors} onColorChange={handleColorChange} />
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = (state, { tokenType, editLocale }) => {
  const title = getEntryValueForLocale(tokenType.get('titleEntries'), editLocale);
  return {
    title: title,
    color: tokenType.get('color'),
    number: tokenType.get('number')
  };
};

const mapDispatchToProps = dispatch => ({
  handleColorChange: color => dispatch(updateTokenColor(color.hex))
});

export default connect(mapStateToProps, mapDispatchToProps)(TokenTypeForm);