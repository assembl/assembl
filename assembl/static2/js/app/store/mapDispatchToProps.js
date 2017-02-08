import { setLocale } from 'react-redux-i18n';
import ContextActions from '../actions/contextActions';
import DebateActions from '../actions/debateActions';
import PostsActions from '../actions/postsActions';
import UsersActions from '../actions/usersActions';
import PartnersActions from '../actions/partnersActions';

const MapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (id) => {
      dispatch(DebateActions.fetchDebateData(id));
    },
    fetchPosts: (id) => {
      dispatch(PostsActions.fetchPosts(id));
    },
    fetchUsers: (id) => {
      dispatch(UsersActions.fetchUsers(id));
    },
    fetchPartners: (id) => {
      dispatch(PartnersActions.fetchPartners(id));
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