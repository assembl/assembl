// @flow

import React, { Component } from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { WithContext as ReactTags } from 'react-tag-input';
/* eslint-enable */
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { additionTag, deleteTag } from '../../../actions/tagActions';

import AddkeywordIcon from '../icons/addkeywordIcon/addkeywordIcon';
import CrossIcon from '../icons/crossIcon/crossIcon';
import { displayAlert } from '../../../utils/utilityManager';

import addTagMutation from '../../../graphql/mutations/addTag.graphql';
import removeTagMutation from '../../../graphql/mutations/removeTag.graphql';

export type TagProps = {
  id: string,
  text: string
};

export type Props = {
  postId: string,
  isAdmin?: boolean,
  alreadyAdded?: string,
  addTag: Function,
  removeTag: Function,
  tags: Array<TagProps>,
  suggestions: Array<TagProps>,
  deleteTag: Function,
  additionTag: Function
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

export class DumbTags extends Component<Props> {
  static defaultProps = {
    isAdmin: false,
    alreadyAdded: 'Already added'
  };

  handleDelete = (i: number) => {
    const { postId, removeTag, tags } = this.props;
    const selectedTag = tags[i];
    const variables = {
      taggableId: postId,
      id: selectedTag.id
    };
    displayAlert('success', I18n.t('loading.wait'));
    removeTag({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.tags.removeTagSuccessMsg', { tag: selectedTag.text }));
        this.props.deleteTag(i);
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
      .then((result) => {
        const dataTags = result.data.addTag.tags;
        // dataTags ne se vide pas, elle contient d'anciens ajouts
        // si j'ajoute un nouveau tag, elle m'ajoute tous ceux présents dans dataTags
        const tagsList = dataTags.map(tagItem => ({ id: tagItem.id, text: tagItem.value }));
        displayAlert('success', I18n.t('harvesting.tags.addTagSuccessMsg', { tag: tag.text }));
        this.props.additionTag(tagsList);
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { isAdmin, alreadyAdded, suggestions, tags } = this.props;

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

const mapStateToProps = state => ({
  tags: state.tag.tags,
  suggestions: state.tag.suggestions
});

const mapDispatchToProps = dispatch => ({
  additionTag: (tag, id) => {
    dispatch(additionTag(tag, id));
  },
  deleteTag: (tagKey) => {
    dispatch(deleteTag(tagKey));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(addTagMutation, {
    name: 'addTag'
  }),
  graphql(removeTagMutation, {
    name: 'removeTag'
  })
)(DumbTags);