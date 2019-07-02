// @flow

import React, { Component } from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { WithContext as ReactTags } from 'react-tag-input';
/* eslint-enable */
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
// Component imports
import AddkeywordIcon from '../icons/addkeywordIcon/addkeywordIcon';
import CrossIcon from '../icons/crossIcon/crossIcon';
import manageErrorAndLoading from '../manageErrorAndLoading';
// Helper imports
import { displayAlert } from '../../../utils/utilityManager';
import { formatedTagList } from '../../../utils/globalFunctions';
// GraphQL imports
import addTagMutation from '../../../graphql/mutations/addTag.graphql';
import removeTagMutation from '../../../graphql/mutations/removeTag.graphql';
// Action imports
import { updateTags } from '../../../actions/tagActions';

export type TagProps = {
  /** Tag ID */
  id: string,
  /** Tag value */
  text: string
};

export type Props = {
  /** Flag that checks whether the tag is already added and displayed */
  alreadyAddedWarningMessage?: string,
  /** Flag that checks whether we have to display the admin mode */
  isAdmin?: boolean,
  /** List of existing tags in the overall discussion fetched and updated from the general store */
  existingTags: Array<TagProps>,
  initialExistingTags: Array<TagProps>,
  /** Post ID */
  postId: string,
  /** List of tags related to the current post */
  tagsList: Array<TagProps>,
  /** Graphql mutation function called to add a new tag */
  addTag: Function,
  /** Graphql mutation function called to remove an existing tag */
  removeTag: Function,
  /** Tag list update callback: is call when a tag is added or deleted */
  onTagListUpdateCallback: (Array<TagProps>) => void,
  /** Use redux action to update autocomplete list in store when adding tag */
  updateTags: Function,
  contentLocale: string
};

type State = {
  /** List of tags related to the current post */
  tags: Array<TagProps>
};

const KeyCodes = {
  comma: 188,
  enter: 13
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

const RemoveComponent = props => (
  <span className="icon-delete" onClick={props.onClick}>
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
    alreadyAddedWarningMessage: 'Already added'
  };

  state = {
    tags: [...this.props.tagsList]
  };

  handleDelete = (i: number) => {
    const { tags } = this.state;
    const { postId, removeTag, onTagListUpdateCallback, contentLocale } = this.props;
    const selectedTag = tags[i];
    const variables = {
      taggableId: postId,
      id: selectedTag.id,
      contentLocale: contentLocale
    };
    removeTag({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('harvesting.tags.removeTagSuccessMsg', { tag: selectedTag.text }));
        this.setState(
          {
            tags: tags.filter((tag, index) => index !== i)
          },
          () => onTagListUpdateCallback(this.state.tags)
        );
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  handleAddition = (tag: TagProps) => {
    const { postId, addTag, onTagListUpdateCallback, initialExistingTags, existingTags, contentLocale } = this.props;
    const variables = {
      taggableId: postId,
      value: tag.text,
      contentLocale: contentLocale
    };
    addTag({ variables: variables })
      .then((result) => {
        const newTag = { id: result.data.addTag.tag.id, text: result.data.addTag.tag.value };
        const indexNewTag = this.state.tags.findIndex(item => item.id === newTag.id);
        if (indexNewTag === -1) {
          displayAlert('success', I18n.t('harvesting.tags.addTagSuccessMsg', { tag: tag.text }));
          this.setState(state => ({
            tags: [...state.tags, newTag]
          }));
          const index = existingTags.findIndex(item => item.id === newTag.id);
          if (index === -1) {
            const updateSuggestionList = initialExistingTags.concat({
              id: result.data.addTag.tag.id,
              value: result.data.addTag.tag.value
            });
            this.props.updateTags(updateSuggestionList);
          }
          onTagListUpdateCallback(this.state.tags);
        }
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  render() {
    const { isAdmin, alreadyAddedWarningMessage, existingTags } = this.props;
    const { tags } = this.state;
    const reactTagsProps = {
      allowDragDrop: false,
      isAdmin: isAdmin,
      tags: tags,
      allowUnique: true,
      allowUniqueWarning: alreadyAddedWarningMessage,
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
  existingTags: formatedTagList(state.tags),
  initialExistingTags: state.tags,
  contentLocale: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  updateTags: (tags) => {
    dispatch(updateTags(tags));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(addTagMutation, {
    name: 'addTag'
  }),
  graphql(removeTagMutation, {
    name: 'removeTag'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbTags);