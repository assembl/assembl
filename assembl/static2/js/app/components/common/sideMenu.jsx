// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { getChildren } from '../../utils/tree';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import SideMenuTree from './sideMenuTree';

type SideMenuProps = {
  rootIdeas: Array<Object>,
  descendants: Array<Object>,
  synthesisPostId: string
};

const SideMenu = (props: SideMenuProps) => {
  const { rootIdeas, descendants, synthesisPostId } = props;
  const slug = getDiscussionSlug();
  return (
    <div className="synthesis-side-menu">
      <Translate value="synthesis.summary" className="dark-title-4" />
      <div className="title-hyphen block">&nbsp;</div>
      {rootIdeas.map((rootIdea, index) => (
        <SideMenuTree
          key={rootIdea.id}
          rootIdea={rootIdea}
          index={index + 1}
          parents={[]}
          subIdeas={getChildren(rootIdea, descendants)}
          slug={slug}
          synthesisPostId={synthesisPostId}
        />
      ))}
    </div>
  );
};

export default SideMenu;