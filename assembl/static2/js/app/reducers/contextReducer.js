import { encodeUserIdBase64 } from '../utils/globalFunctions';

const assemblVersionNode = document.getElementById('assemblVersion');
const assemblVersion = assemblVersionNode ? assemblVersionNode.value : null;
const initialState = {
  assemblVersion: assemblVersion,
  rootPath: null,
  debateId: null,
  connectedUserId: null,
  connectedUserIdBase64: null,
  connectedUserName: null,
  isHarvesting: false
};

const ContextReducer = (state = initialState, action) => {
  switch (action.type) {
  case 'ADD_CONTEXT':
    return {
      ...state,
      rootPath: action.rootPath,
      debateId: action.debateId,
      connectedUserId: action.connectedUserId,
      connectedUserIdBase64: encodeUserIdBase64(action.connectedUserId),
      connectedUserName: action.connectedUserName
    };
  case 'TOGGLE_HARVESTING':
    return {
      ...state,
      isHarvesting: !state.isHarvesting
    };
  default:
    return state;
  }
};

export default ContextReducer;

export const getConnectedUserId = state => state.context.connectedUserId;

export const getDebateId = state => state.context.debateId;

export const getLocale = state => state.i18n.locale;

export const getConnectedUserName = state => state.context.connectedUserName;