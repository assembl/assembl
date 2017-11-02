import { CREATE_RESOURCE } from '../actionTypes';

export const createResource = (id) => {
  return { id: id, type: CREATE_RESOURCE };
};