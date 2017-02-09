import { setLocale } from 'react-redux-i18n';
import ContextActions from '../actions/contextActions';
import DebateActions from '../actions/debateActions';
import PostsActions from '../actions/postsActions';
import UsersActions from '../actions/usersActions';
import PartnersActions from '../actions/partnersActions';

const MapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (debateId) => {
      dispatch(DebateActions.fetchDebateData(debateId));
    },
    fetchPosts: (debateId) => {
      dispatch(PostsActions.fetchPosts(debateId));
    },
    fetchUsers: (debateId, connectedUserId) => {
      dispatch(UsersActions.fetchUsers(debateId, connectedUserId));
    },
    fetchPartners: (debateId) => {
      dispatch(PartnersActions.fetchPartners(debateId));
    },
    addContext: (path, debateId, connectedUserId) => {
      dispatch(ContextActions.addContext(path, debateId, connectedUserId));
    },
    changeLanguage: (locale) => {
      dispatch(setLocale(locale));
    }
  };
};

export default MapDispatchToProps;