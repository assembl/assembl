// @flow
import * as actionTypes from '../actionTypes';

export const createResource = (id: string, order: number): actionTypes.CreateResource => {
  return { id: id, order: order, type: actionTypes.CREATE_RESOURCE };
};

export const deleteResource = (id: string): actionTypes.DeleteResource => {
  return { id: id, type: actionTypes.DELETE_RESOURCE };
};

export const updateResourceDocument = (id: string, value: string): actionTypes.UpdateResourceDocument => {
  return {
    id: id,
    value: value,
    type: actionTypes.UPDATE_RESOURCE_DOCUMENT
  };
};

export const updateResourceEmbedCode = (id: string, value: string): actionTypes.UpdateResourceEmbedCode => {
  return {
    id: id,
    value: value,
    type: actionTypes.UPDATE_RESOURCE_EMBED_CODE
  };
};

export const updateResourceImage = (id: string, value: string): actionTypes.UpdateResourceImage => {
  return {
    id: id,
    value: value,
    type: actionTypes.UPDATE_RESOURCE_IMAGE
  };
};

export const updateResourceText = (id: string, locale: string, value: string): actionTypes.UpdateResourceText => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: actionTypes.UPDATE_RESOURCE_TEXT
  };
};

export const updateResourceTitle = (id: string, locale: string, value: string): actionTypes.UpdateResourceTitle => {
  return {
    id: id,
    locale: locale,
    value: value,
    type: actionTypes.UPDATE_RESOURCE_TITLE
  };
};

export const updateResources = (resources: actionTypes.ResourcesArray): actionTypes.UpdateResources => {
  return {
    resources: resources,
    type: actionTypes.UPDATE_RESOURCES
  };
};