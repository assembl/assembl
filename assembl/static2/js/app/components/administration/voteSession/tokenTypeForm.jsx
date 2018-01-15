// @flow
import React from 'react';
import { connect } from 'react-redux';
import { TwitterPicker } from 'react-color';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

const TokenTypeForm = ({ title, color, number }) => {
  const handleTitleChange = () => {};
  const handleNumberChange = () => {};
  const handleColorChange = () => {};

  const pickerColors = [
    '#B8E986',
    '#00AA7B',
    '#FCB900',
    '#FF6900',
    '#8646ED',
    '#FF82BE',
    '#00DCFF',
    '#1652C1',
    '#EB144C',
    '#000000'
  ];

  return (
    <div className="token-type-form">
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
      <TwitterPicker colors={pickerColors} onChange={handleColorChange} width="400" className="color-picker" />
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = (state, { id, editLocale }) => {
  const { tokenTypesById } = state.admin.voteSession;
  const tokenType = tokenTypesById.get(id);
  const title = getEntryValueForLocale(tokenType.get('titleEntries'), editLocale);
  return {
    title: title,
    color: tokenType.get('color'),
    number: tokenType.get('number')
  };
};

export default connect(mapStateToProps)(TokenTypeForm);