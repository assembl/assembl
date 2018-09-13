// @flow
import { ContentState } from 'draft-js';

export default {
  createEntity: function (type: DraftEntityType, mutability: DraftEntityMutability, data: Object) {
    const contentState = ContentState.createFromText('');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    const contentStateWithEntity = contentState.createEntity(type, mutability, data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    return contentState.getEntity(entityKey);
  },

  createDocumentEntity: function (data: Object) {
    return this.createEntity('DOCUMENT', 'IMMUTABLE', data);
  }
};