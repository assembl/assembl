// @flow

import React, { Component } from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { WithContext as ReactTags } from 'react-tag-input';
/* eslint-enable */
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import AddkeywordIcon from '../icons/addkeywordIcon/addkeywordIcon';
import CrossIcon from '../icons/crossIcon/crossIcon';
import { displayAlert } from '../../../utils/utilityManager';
import { formatedTagList } from '../../../utils/globalFunctions';
import addTagMutation from '../../../graphql/mutations/addTag.graphql';
import removeTagMutation from '../../../graphql/mutations/removeTag.graphql';
import manageErrorAndLoading from '../manageErrorAndLoading';

export type TagProps = {
  id: string,
  text: string
};

export type Props = {
  postId: string,
  isAdmin?: boolean,
  tagsList: Array<TagProps>,
  alreadyAdded?: string,
  addTag: Function,
  removeTag: Function,
  existingTags: Array<TagProps>
};

type State = {
  tags: Array<TagProps>
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
    tags: [...this.props.tagsList]
  };

  handleDelete = (i: number) => {
    const { tags } = this.state;
    const { postId, removeTag } = this.props;
    const selectedTag = tags[i];
    const variables = {
      taggableId: postId,
      id: selectedTag.id
    };
    removeTag({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.tags.removeTagSuccessMsg', { tag: selectedTag.text }));
        this.setState({
          tags: tags.filter((tag, index) => index !== i)
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
    addTag({ variables: variables })
      .then((result) => {
        const newTag = { id: result.data.addTag.tag.id, text: result.data.addTag.tag.value };
        displayAlert('success', I18n.t('harvesting.tags.addTagSuccessMsg', { tag: tag.text }));
        this.setState(state => ({
          tags: [...state.tags, newTag]
        }));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { isAdmin, alreadyAdded, existingTags } = this.props;
    const { tags } = this.state;
    const reactTagsProps = {
      allowDragDrop: false,
      isAdmin: isAdmin,
      tags: tags,
      allowUnique: true,
      allowUniqueWarning: alreadyAdded,
      suggestions: existingTags,
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
  existingTags: formatedTagList(state.tags)
});

export default compose(
  connect(mapStateToProps),
  graphql(addTagMutation, {
    name: 'addTag'
  }),
  graphql(removeTagMutation, {
    name: 'removeTag'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbTags);