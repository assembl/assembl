// @flow

import React, { Component } from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { WithContext as ReactTags } from 'react-tag-input';
/* eslint-enable */
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

import AddkeywordIcon from '../icons/addkeywordIcon/addkeywordIcon';
import CrossIcon from '../icons/crossIcon/crossIcon';
import { displayAlert } from '../../../utils/utilityManager';

import addTagMutation from '../../../graphql/mutations/addTag.graphql';
import removeTagMutation from '../../../graphql/mutations/removeTag.graphql';

type TagProps = {
  id: string,
  text: string
};

export type Props = {
  postId: string,
  isAdmin?: boolean,
  tagsList: Array<TagProps>,
  alreadyAdded?: string,
  addTag: Function,
  removeTag: Function
};

type State = {
  tags: Array<TagProps>,
  suggestions: Array<TagProps>
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

export class DumbTags extends Component<Props, State> {
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
    const { postId, removeTag } = this.props;
    const selectedTag = tags[i];
    const variables = {
      taggableId: postId,
      id: selectedTag.id
    };
    displayAlert('success', I18n.t('loading.wait'));
    removeTag({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.tags.removeTagSuccessMsg', { tag: selectedTag.text }));
        this.setState({
          tags: tags.filter((tag, index) => index !== i),
          suggestions: tags.filter((tag, index) => index !== i)
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  handleAddition = (tag: TagProps) => {
    const { postId, addTag } = this.props;
    const variables = {
      taggableId: postId,
      value: tag.text
    };
    displayAlert('success', I18n.t('loading.wait'));
    addTag({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.tags.addTagSuccessMsg', { tag: tag.text }));
        this.setState(state => ({ tags: [...state.tags, tag], suggestions: [...state.suggestions, tag] }));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { isAdmin, alreadyAdded } = this.props;
    const { suggestions, tags } = this.state;

    const reactTagsProps = {
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
        <ReactTags {...reactTagsProps} />
      </div>
    );
  }
}

export default compose(
  graphql(addTagMutation, {
    name: 'addTag'
  }),
  graphql(removeTagMutation, {
    name: 'removeTag'
  })
)(DumbTags);