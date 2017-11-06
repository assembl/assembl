import { CREATE_RESOURCE } from '../actionTypes';

export const createResource = (id, order) => {
  return { id: id, order: order, type: CREATE_RESOURCE };
};