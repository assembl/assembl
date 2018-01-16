// @flow
import React from 'react';
import { connect } from 'react-redux';
import { TwitterPicker } from 'react-color';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateTokenVoteTypeTitle } from '../../../actions/adminActions/voteSession';
import { pickerColors } from '../../../constants';

const TokenTypeForm = ({ title, color, number, handleTitleChange }) => {
  const handleNumberChange = () => {};
  const handleColorChange = () => {};

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
      <TwitterPicker colors={pickerColors} onChange={handleColorChange} width="400px" className="color-picker" />
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

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleTitleChange: e => dispatch(updateTokenVoteTypeTitle(id, editLocale, e.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(TokenTypeForm);