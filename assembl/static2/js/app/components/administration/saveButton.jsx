// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';

import { type MutationsPromises } from '../form/types.flow';

type Props = {
  buttonId: string,
  disabled?: boolean,
  label: string,
  saveAction: () => void,
  specificClasses?: ?string
};

type Item = {
  id: string,
  _isNew: boolean,
  _toDelete: boolean,
  _hasChanged: boolean,
  [string]: any
};

type Query = {
  query: any,
  variables?: Object
};

type Params = {
  items: Array<Item>,
  variablesCreator: (Item, number) => Object,
  updateMutation: Function,
  deleteVariablesCreator?: Item => Object,
  createMutation?: Function,
  deleteMutation?: Function,
  refetchQueries?: Array<Query>,
  lang?: string
};

/*
  we need this because if we try to run mutations in parallel
  the database will encounter a conflict
*/
export const runSerial = (tasks: MutationsPromises) => {
  if (tasks.length > 0 && typeof tasks[0] !== 'function') {
    throw new Error('runSerial takes an array of functions with each function returning a Promise');
  }
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

/* Utility that creates create/delete/update mutations for a list of items */
export const getMutationsPromises = (params: Params) => {
  const {
    items,
    variablesCreator,
    deleteVariablesCreator,
    createMutation,
    deleteMutation,
    updateMutation,
    refetchQueries,
    lang
  } = params;
  const promises = [];
  items.forEach((item, index) => {
    if (item._isNew && item._toDelete) {
      // do nothing
    } else if (item._isNew && !item._toDelete && createMutation) {
      // create item
      const variables = variablesCreator(item, index);
      variables.lang = lang;
      const payload = {
        refetchQueries: refetchQueries || [],
        variables: variables
      };
      const p1 = () => createMutation(payload);
      promises.push(p1);
    } else if (deleteVariablesCreator && item._toDelete && !item._isNew && deleteMutation) {
      // delete item
      const payload = {
        refetchQueries: refetchQueries || [],
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
        refetchQueries: refetchQueries || [],
        variables: variables
      };
      const p2 = () => updateMutation(payload);
      promises.push(p2);
    }
  });

  return promises;
};

export const DumbSaveButton = ({ buttonId, disabled, saveAction, specificClasses, label }: Props) => {
  const isHoverClass = !disabled ? 'button-dark' : '';
  const buttonClasses = specificClasses || classNames('save-button button-submit right', isHoverClass);

  return (
    <Button className={buttonClasses} disabled={disabled} onClick={saveAction}>
      <Translate value={label} />
    </Button>
  );
};

DumbSaveButton.defaultProps = {
  specificClasses: null,
  disabled: false
};

class SaveButtonInPortal extends React.PureComponent<Props> {
  static defaultProps = {
    specificClasses: null,
    buttonId: 'save-button',
    label: 'administration.saveThemes'
  };

  componentDidMount() {
    const saveButton = document.getElementById(this.props.buttonId);
    if (saveButton) saveButton.appendChild(this.el);
  }

  componentWillUnmount() {
    const saveButton = document.getElementById(this.props.buttonId);
    if (saveButton) saveButton.removeChild(this.el);
  }

  el: HTMLElement = document.createElement('span');

  render() {
    return ReactDOM.createPortal(<DumbSaveButton {...this.props} />, this.el);
  }
}

export default SaveButtonInPortal;