import React from 'react';
import ReactDOM from 'react-dom';
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
      const variables = variablesCreator(item, index);
      variables.lang = lang;
      const payload = {
        refetchQueries: params.refetchQueries || [],
        variables: variables
      };
      const p1 = () => createMutation(payload);
      promises.push(p1);
    } else if (item._toDelete && !item._isNew && deleteMutation) {
      // delete item
      const payload = {
        refetchQueries: params.refetchQueries || [],
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
        refetchQueries: params.refetchQueries || [],
        variables: variables
      };
      const p2 = () => updateMutation(payload);
      promises.push(p2);
    }
  });

  return promises;
};

export const DumbSaveButton = ({ disabled, saveAction, specificClasses }) => {
  const buttonClasses = specificClasses || 'save-button button-submit button-dark right';
  return (
    <Button className={buttonClasses} disabled={disabled} onClick={saveAction}>
      <Translate value="administration.saveThemes" />
    </Button>
  );
};

class SaveButtonInPortal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.el = document.createElement('span');
  }

  componentDidMount() {
    document.getElementById('save-button').appendChild(this.el);
  }

  componentWillUnmount() {
    document.getElementById('save-button').removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(<DumbSaveButton {...this.props} />, this.el);
  }
}

export default SaveButtonInPortal;