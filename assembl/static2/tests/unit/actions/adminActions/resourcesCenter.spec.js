import * as actions from '../../../../js/app/actions/adminActions/resourcesCenter';
import {
  CREATE_RESOURCE,
  DELETE_RESOURCE,
  UPDATE_RESOURCE_EMBED_CODE,
  UPDATE_RESOURCE_IMAGE,
  UPDATE_RESOURCE_TEXT,
  UPDATE_RESOURCE_TITLE
} from '../../../../js/app/actions/actionTypes';

describe('resourcesCenter admin actions', () => {
  describe('createResource action', () => {
    const { createResource } = actions;
    it('should return a CREATE_RESOURCE action type', () => {
      const actual = createResource('-3344789', 1);
      const expected = { id: '-3344789', order: 1, type: CREATE_RESOURCE };
      expect(actual).toEqual(expected);
    });
  });

  describe('deleteResource action', () => {
    const { deleteResource } = actions;
    it('should return a DELETE_RESOURCE action type', () => {
      const actual = deleteResource('-3344789');
      const expected = { id: '-3344789', type: DELETE_RESOURCE };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateResourceEmbedCode action', () => {
    const { updateResourceEmbedCode } = actions;
    it('should return a UPDATE_RESOURCE_EMBED_CODE action type', () => {
      const actual = updateResourceEmbedCode('123', 'new value');
      const expected = {
        id: '123',
        value: 'new value',
        type: UPDATE_RESOURCE_EMBED_CODE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateResourceImage action', () => {
    const { updateResourceImage } = actions;
    it('should return a UPDATE_RESOURCE_IMAGE action type', () => {
      const actual = updateResourceImage('123', { name: 'foo.jpg', type: 'image/jpeg' });
      const expected = {
        id: '123',
        value: { name: 'foo.jpg', type: 'image/jpeg' },
        type: UPDATE_RESOURCE_IMAGE
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateResourceText action', () => {
    const { updateResourceText } = actions;
    it('should return a UPDATE_RESOURCE_TEXT action type', () => {
      const actual = updateResourceText('123', 'en', 'new value');
      const expected = {
        id: '123',
        locale: 'en',
        value: 'new value',
        type: UPDATE_RESOURCE_TEXT
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateResourceTitle action', () => {
    const { updateResourceTitle } = actions;
    it('should return a UPDATE_RESOURCE_TITLE action type', () => {
      const actual = updateResourceTitle('123', 'en', 'new value');
      const expected = {
        id: '123',
        locale: 'en',
        value: 'new value',
        type: UPDATE_RESOURCE_TITLE
      };
      expect(actual).toEqual(expected);
    });
  });
});