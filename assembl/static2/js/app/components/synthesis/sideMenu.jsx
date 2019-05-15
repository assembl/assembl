// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { getChildren } from '../../utils/tree';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import SideMenuTree from './sideMenuTree';
import type { SynthesisIdea } from './types.flow';

type SideMenuProps = {
  rootIdeas: Array<SynthesisIdea>,
  descendants: Array<SynthesisIdea>,
  synthesisPostId: string,
  ideaOnScroll?: string,
  show: boolean,
  innerRef?: Function
};

const SideMenu = (props: SideMenuProps) => {
  const { rootIdeas, descendants, synthesisPostId, ideaOnScroll, innerRef, show } = props;
  const slug = getDiscussionSlug();
  return (
    <div className="synthesis-side-menu" ref={innerRef} style={{ display: show ? 'block' : 'none' }}>
      <Translate value="synthesis.tableOfContents" className="dark-title-4" />
      <div className="title-hyphen block">&nbsp;</div>
      {rootIdeas.map((rootIdea, index) => (
        <SideMenuTree
          ideaOnScroll={ideaOnScroll}
          key={rootIdea.id}
          rootIdea={rootIdea}
          index={index + 1}
          parents={[]}
          subIdeas={getChildren(rootIdea, descendants)}
          // $FlowFixMe slug can be null if retrieve via getDiscussionSlug()
          slug={slug}
          synthesisPostId={synthesisPostId}
        />
      ))}
    </div>
  );
};

SideMenu.defaultProps = {
  ideaOnScroll: null,
  innerRef: null
};

export default SideMenu;