// @flow

import React, { Component } from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { WithContext as ReactTags } from 'react-tag-input';
/* eslint-enable */

import AddkeywordIcon from '../icons/addkeywordIcon/addkeywordIcon';
import CrossIcon from '../icons/crossIcon/crossIcon';

type tagProps = {
  id: string,
  text: string
};

export type Props = {
  isAdmin?: boolean,
  tagsList: Array<tagProps>,
  alreadyAdded?: string
};

type State = {
  tags: Array<tagProps>,
  suggestions: Array<tagProps>
};

const KeyCodes = {
  comma: 188,
  enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

const RemoveComponent = () => (
  <span className="icon-delete">
    <CrossIcon />
  </span>
);

const AddComponent = () => (
  <span className="icon-add">
    <AddkeywordIcon />
  </span>
);

class Tags extends Component<Props, State> {
  static defaultProps = {
    isAdmin: false,
    alreadyAdded: 'Already added'
  };

  state = {
    tags: [...this.props.tagsList],
    suggestions: [...this.props.tagsList]
  };

  handleDelete = (i: number) => {
    const { tags } = this.state;
    this.setState({
      tags: tags.filter((tag, index) => index !== i),
      suggestions: tags.filter((tag, index) => index !== i)
    });
  };

  handleAddition = (tag: tagProps) => {
    this.setState(state => ({ tags: [...state.tags, tag], suggestions: [...state.suggestions, tag] }));
  };

  render() {
    const { isAdmin, alreadyAdded } = this.props;
    const { suggestions, tags } = this.state;

    const tagsProps = {
      allowDragDrop: false,
      isAdmin: isAdmin,
      tags: tags,
      allowUnique: true,
      allowUniqueWarning: alreadyAdded,
      suggestions: suggestions,
      handleDelete: this.handleDelete,
      handleAddition: this.handleAddition,
      delimiters: delimiters,
      removeComponent: RemoveComponent,
      addComponent: AddComponent,
      placeholder: ''
    };

    return (
      <div>
        <ReactTags {...tagsProps} />
      </div>
    );
  }
}

export default Tags;