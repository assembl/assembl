import React from 'react';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

export const runSerial = (tasks) => {
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

/* Utility that creates create/delete/update mutations for a list of items */
export const getMutationsPromises = (params) => {
  const { items, variablesCreator, deleteVariablesCreator, createMutation, deleteMutation, updateMutation, lang } = params;
  const promises = [];
  items.forEach((item, index) => {
    if (item._isNew && item._toDelete) {
      // do nothing
    } else if (item._isNew && !item._toDelete && createMutation) {
      // create item
      const payload = {
        variables: variablesCreator(item, index)
      };
      const p1 = () => createMutation(payload);
      promises.push(p1);
    } else if (item._toDelete && !item._isNew && deleteMutation) {
      // delete item
      const payload = {
        variables: deleteVariablesCreator(item)
      };
      const p3 = () => deleteMutation(payload);
      promises.push(p3);
    } else if (item._hasChanged && updateMutation) {
      // update item
      const variables = variablesCreator(item, index);
      variables.id = item.id;
      variables.lang = lang;
      const payload = {
        variables: variables
      };
      const p2 = () => updateMutation(payload);
      promises.push(p2);
    }
  });

  return promises;
};

export default ({ disabled, saveAction, specificClasses }) => {
  const buttonClasses = specificClasses || 'save-button button-submit button-dark right';
  return (
    <Button className={buttonClasses} disabled={disabled} onClick={saveAction}>
      <Translate value="administration.saveThemes" />
    </Button>
  );
};