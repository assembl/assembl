import { setLocale } from 'react-redux-i18n';
import { addContext } from '../actions/contextActions';
import { fetchDebateData } from '../actions/debateActions';
import { fetchPosts } from '../actions/postsActions';
import { fetchUsers } from '../actions/usersActions';
import { fetchPartners } from '../actions/partnersActions';
import { fetchSynthesis } from '../actions/synthesisActions';
import { fetchIdeas } from '../actions/ideasActions';

const MapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (debateId) => {
      dispatch(fetchDebateData(debateId));
    },
    fetchPosts: (debateId) => {
      dispatch(fetchPosts(debateId));
    },
    fetchUsers: (debateId, connectedUserId) => {
      dispatch(fetchUsers(debateId, connectedUserId));
    },
    fetchPartners: (debateId) => {
      dispatch(fetchPartners(debateId));
    },
    fetchSynthesis: (debateId) => {
      dispatch(fetchSynthesis(debateId));
    },
    fetchIdeas: (debateId) => {
      dispatch(fetchIdeas(debateId));
    },
    addContext: (path, debateId, connectedUserId) => {
      dispatch(addContext(path, debateId, connectedUserId));
    },
    changeLanguage: (locale) => {
      dispatch(setLocale(locale));
    }
  };
};

export default MapDispatchToProps;