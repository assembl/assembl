// @flow
import React from 'react';
import { connect } from 'react-redux';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

const TokenTypeForm = ({ title, color, number }) => {
  const handleTitleChange = () => {};
  const handleNumberChange = () => {};
  const handleColorChange = () => {};
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
export default connect(mapStateToProps)(TokenTypeForm);