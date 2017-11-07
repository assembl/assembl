import {
  CREATE_RESOURCE,
  DELETE_RESOURCE,
  UPDATE_RESOURCE_DOCUMENT,
  UPDATE_RESOURCE_EMBED_CODE,
  UPDATE_RESOURCE_IMAGE,
  UPDATE_RESOURCE_TEXT,
  UPDATE_RESOURCE_TITLE
} from '../actionTypes';

export const createResource = (id, order) => {
  return { id: id, order: order, type: CREATE_RESOURCE };
};

export const deleteResource = (id) => {
  return { id: id, type: DELETE_RESOURCE };
};

export const updateResourceDocument = (id, value) => {
  return {
    id: id,
    value: value,
    type: UPDATE_RESOURCE_DOCUMENT
  };
};

export const updateResourceEmbedCode = (id, value) => {
  return {
    id: id,
    value: value,
    type: UPDATE_RESOURCE_EMBED_CODE
  };
};

export const updateResourceImage = (id, value) => {
  return {
    id: id,
    value: value,
    type: UPDATE_RESOURCE_IMAGE
  };
};

export const updateResourceText = (id, locale, value) => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: UPDATE_RESOURCE_TEXT
  };
};

export const updateResourceTitle = (id, locale, value) => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: UPDATE_RESOURCE_TITLE
  };
};