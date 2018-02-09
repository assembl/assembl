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
    if (item.isNew && !item.toDelete) {
      // create item
      const payload = {
        variables: variablesCreator(item, index)
      };
      const p1 = () => createMutation(payload);
      promises.push(p1);
    } else if (item.toDelete && !item.isNew) {
      // delete item
      const payload = {
        variables: deleteVariablesCreator(item)
      };
      const p3 = () => deleteMutation(payload);
      promises.push(p3);
    } else {
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

export default ({ disabled, saveAction }) => (
  <Button className="save-button button-submit button-dark right" disabled={disabled} onClick={saveAction}>
    <Translate value="administration.saveThemes" />
  </Button>
);