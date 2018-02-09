import React from 'react';
import { Route, Redirect } from 'react-router';
import Root from './root';
import App from './app';
import Main from './main';
import Login from './pages/login';
import Signup from './pages/signup';
import ChangePassword from './pages/changePassword';
import RequestPasswordChange from './pages/requestPasswordChange';
import Home from './pages/home';
import Syntheses from './pages/syntheses';
import Synthesis from './pages/synthesis';
import Debate from './pages/debate';
import DebateThread from './pages/debateThread';
import Survey from './pages/survey';
import VoteSession from './pages/voteSession';
import Idea from './pages/idea';
import Community from './pages/community';
import Question from './pages/question';
import Profile from './pages/profile';
import Styleguide from './pages/styleguide';
import NotFound from './pages/notFound';
import TermsAndConditions from './pages/termsAndConditions';
import LegalNotice from './pages/legalNotice';
import Administration from './pages/administration';
import UnauthorizedAdministration from './pages/unauthorizedAdministration';
import ResourcesCenterAdmin from './pages/resourcesCenterAdmin';
import SurveyAdmin from './pages/surveyAdmin';
import ThreadAdmin from './pages/threadAdmin';
import DiscussionAdmin from './pages/discussionAdmin';
import MultiColumnsAdmin from './pages/multiColumnsAdmin';
import VoteSessionAdmin from './pages/voteSessionAdmin';
import ResourcesCenter from './pages/resourcesCenter';
import LandingPageAdmin from './pages/landingPageAdmin';
import { routeForRouter } from './utils/routeMap';

const DebateHome = (props) => {
  switch (props.params.phase) {
  case 'survey':
    return <Debate {...props} />;
  case 'thread':
    return <DebateThread {...props} />;
  case 'multiColumns':
    return <DebateThread {...props} />;
  case 'voteSession':
    return <VoteSession />;
  default:
    return <Debate {...props} />;
  }
};

const DebateChild = (props) => {
  switch (props.params.phase) {
  case 'survey':
    return <Survey id={props.id} identifier={props.identifier} />;
  case 'thread':
    return <Idea id={props.id} identifier={props.identifier} routerParams={props.params} />;
  case 'multiColumns':
    return <Idea id={props.id} identifier={props.identifier} routerParams={props.params} />;
  case 'voteSession':
    return <NotFound />;
  default:
    return <Idea id={props.id} identifier={props.identifier} />;
  }
};

const AdminChild = (props) => {
  switch (props.params.phase) {
  case 'discussion':
    return <DiscussionAdmin {...props} section={props.location.query.section} />;
  case 'survey':
    return <SurveyAdmin {...props} thematicId={props.location.query.thematic} section={props.location.query.section} />;
  case 'thread':
    return <ThreadAdmin {...props} />;
  case 'multiColumns':
    return <MultiColumnsAdmin {...props} />;
  case 'voteSession':
    return <VoteSessionAdmin {...props} section={props.location.query.section} />;
  case 'resourcesCenter':
    return <ResourcesCenterAdmin {...props} />;
  case 'landingPage':
    return <LandingPageAdmin {...props} section={props.location.query.section} />;
  default:
    return <ThreadAdmin {...props} />;
  }
};

export default [
  <Route path="/" component={Root}>
    <Route path={routeForRouter('styleguide', false, { preSlash: true })} component={Styleguide} />
    {/* Those login routes should be kept in synchrony with assembl.views.auth.__init__.py */}
    <Route path={routeForRouter('login', false, { preSlash: true })} component={Login} />
    <Route path={routeForRouter('signup', false, { preSlash: true })} component={Signup} />
    <Route path={routeForRouter('changePassword', false, { preSlash: true })} component={ChangePassword} />
    <Route path={routeForRouter('requestPasswordChange')} component={RequestPasswordChange} />
    {/* These are contextual routes for the ones above */}
    <Route path={routeForRouter('login', true)} component={Login} />
    <Route path={routeForRouter('signup', true)} component={Signup} />
    <Route path={routeForRouter('changePassword', true)} component={ChangePassword} />
    <Route path={routeForRouter('requestPasswordChange', true)} component={RequestPasswordChange} />
    <Route component={App}>
      <Route component={Main}>
        <Redirect from={routeForRouter('homeBare')} to={routeForRouter('home')} />
        <Route path={routeForRouter('home')} component={Home} />
        <Route path={routeForRouter('homeBare')} component={Home} />
        <Route path={routeForRouter('profile', false, { userId: ':userId' })} component={Profile} />
        <Route path={routeForRouter('syntheses')} component={Syntheses} />
        <Route path={routeForRouter('synthesis', false, { synthesisId: ':synthesisId' })} component={Synthesis} />
        <Route path={routeForRouter('resourcesCenter')} component={ResourcesCenter} />
        <Route path={routeForRouter('legalNotice')} component={LegalNotice} />
        <Route path={routeForRouter('terms')} component={TermsAndConditions} />
        <Route path={routeForRouter('community')} component={Community} />
        <Route path={routeForRouter('rootDebate')} />
        <Route path={routeForRouter('debate', false, { phase: ':phase' })} component={DebateHome}>
          <Route path={routeForRouter('theme', false, { themeId: ':themeId' })} component={DebateChild} />
          <Route
            path={routeForRouter('question', false, { questionId: ':questionId', questionIndex: ':questionIndex' })}
            component={Question}
          />
        </Route>
        <Route path={routeForRouter('unauthorizedAdministration')} component={UnauthorizedAdministration} />
        <Route path={routeForRouter('administration')} component={Administration}>
          <Route path={routeForRouter('adminPhase', false, { phase: ':phase' })} component={AdminChild} />
        </Route>
      </Route>
    </Route>
  </Route>,
  <Route path="*" component={NotFound} />
];