// @flow
import * as React from 'react';
import classNames from 'classnames';
import { graphql } from 'react-apollo';
import update from 'immutability-helper';
import { OverlayTrigger } from 'react-bootstrap';

import updateTagGQLMutation from '../../graphql/mutations/updateTag.graphql';
import { type Option } from '../form/selectFieldAdapter';
import TagForm from './tagForm';
import { displayAlert } from '../../utils/utilityManager';
import { eidtTagTooltip } from '../common/tooltips';

type Props = {
  contextId: string,
  tag: Option,
  canEdit: boolean,
  excludeOptions: Array<string>,
  remove: (event: SyntheticEvent<HTMLDivElement>) => void,
  updateTag: Function,
  onUpdate: (newTag: Option) => void
};

type State = {
  editing: boolean,
  submitting: boolean
};

type TagData = {
  tag: Option
};

type UpdateTag = {
  id: string,
  value: string,
  taggableId?: string
};

function updateTagMutation({ mutate }) {
  return ({ id, value, taggableId }: UpdateTag) =>
    mutate({
      variables: {
        id: id,
        value: value,
        taggableId: taggableId
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateTag: {
          __typename: 'UpdateTag',
          tag: { __typename: 'Tag', value: value, id: value }
        }
      },
      updateQueries: {
        // Udate the Post query
        Post: (prev, { mutationResult }) => {
          const newExtracts = [];
          let edited = false;
          const newTag = mutationResult.data.updateTag.tag;
          prev.post.extracts.forEach((extract) => {
            const oldTag = extract.tags.filter(tag => tag.id === id)[0];
            if (oldTag) {
              const indexTag = extract.tags.indexOf(oldTag);
              const newExtract = update(extract, {
                tags: { $splice: [[indexTag, 1, newTag]] }
              });
              newExtracts.push(newExtract);
              edited = true;
            } else {
              newExtracts.push(extract);
            }
          });
          if (!edited) return false;
          return update(prev, {
            post: {
              extracts: {
                $set: newExtracts
              }
            }
          });
        }
      }
    });
}

class Tag extends React.Component<Props, State> {
  static defaultProps = {
    canEdit: false
  };

  state = {
    editing: false,
    submitting: false
  };

  updateTag = (values: TagData) => {
    const { updateTag, tag, contextId, onUpdate } = this.props;
    const { tag: { label } } = values;
    this.setState({ submitting: true }, () => {
      updateTag({ id: tag.value, value: label, taggableId: contextId })
        .then(({ data }) => {
          this.setState({ submitting: false, editing: false }, () => {
            const newTag = data.updateTag.tag;
            if (onUpdate) onUpdate({ value: newTag.id, label: newTag.value });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`);
        });
    });
  };

  cancel = (event: SyntheticEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const { editing } = this.state;
    if (editing) {
      this.setState({
        editing: false
      });
    }
  };

  edit = () => {
    const { editing } = this.state;
    if (!editing) {
      this.setState({
        editing: true
      });
    }
  };

  renderForm = () => {
    const { tag, excludeOptions } = this.props;
    return <TagForm initialValue={tag} onSubmit={this.updateTag} onCancel={this.cancel} excludeOptions={excludeOptions} />;
  };

  render() {
    const { tag, remove, canEdit } = this.props;
    const { editing } = this.state;
    const tagTitle = <span className="harvesting-tag-title">{tag.label}</span>;
    return (
      <div
        className={classNames('harvesting-tag-container', { editing: editing, editable: canEdit })}
        onClick={canEdit ? this.edit : null}
      >
        {!editing ? (
          <React.Fragment>
            {canEdit ? (
              <React.Fragment>
                <OverlayTrigger placement="top" overlay={eidtTagTooltip}>
                  {tagTitle}
                </OverlayTrigger>
                <div className="assembl-icon-cancel" onClick={remove} />
              </React.Fragment>
            ) : (
              tagTitle
            )}
          </React.Fragment>
        ) : (
          this.renderForm()
        )}
      </div>
    );
  }
}

export default graphql(updateTagGQLMutation, {
  props: function (props) {
    return {
      updateTag: updateTagMutation(props)
    };
  }
})(Tag);