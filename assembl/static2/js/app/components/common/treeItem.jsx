/* eslint react/no-multi-comp: "off" */
// @flow
import * as React from 'react';
import { Map } from 'immutable';
import debounce from 'lodash/debounce';
import { CellMeasurerCache, List } from 'react-virtualized';

import { scrollToPost } from '../../utils/hashLinkScroll';
import NuggetsManager from './nuggetsManager';

type BaseProps = {
  InnerComponentFolded: ({ nbPosts: number }) => React.Node,
  level: number,
  hidden: boolean,
  contentLocaleMapping: Map<string, string>,
  id: string,
  InnerComponent: (
    BaseProps & {
      contentLocale: string,
      numChildren: number,
      measureTreeHeight: (delay?: number) => void
    }
  ) => React.Node,
  originalLocale?: string,
  rowIndex: number,
  SeparatorComponent: React.Node,
  fullLevel?: string,
  nuggetsManager: NuggetsManager,
  listRef: List,
  cache: CellMeasurerCache,
  identifier: string,
  phaseId: string
};

type Props = {
  children: Array<TreeItem>
} & BaseProps;

type State = {
  expanded: boolean,
  visible: boolean
};

class Child extends React.PureComponent<Props, State> {
  static defaultProps = {
    InnerComponentFolded: () => null,
    level: 0,
    hidden: false
  };

  state = {
    expanded: true,
    visible: false
  };

  componentDidMount() {
    this.onScroll();
    window.addEventListener('scroll', this.onScroll);
    window.addEventListener('resize', this.onScroll);
  }

  componentWillUnmount() {
    this.stopListening();
  }

  holder: HTMLDivElement | null = null;

  scrollAnchor: { current: null | HTMLDivElement } = React.createRef();

  onScroll = debounce(() => {
    const holder = this.holder;
    if (!holder) {
      return;
    }
    const box = holder.getBoundingClientRect();
    const pageYOffset = window.pageYOffset;
    const top = box.top + pageYOffset;
    // visible if the top of the box is in viewport or next page
    const isVisible = top < pageYOffset + 2 * window.innerHeight && top > pageYOffset;
    if (isVisible) {
      this.setState(() => ({
        visible: true
      }));
      this.stopListening();
    }
  }, 100);

  stopListening() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
  }

  resizeTreeHeight = (delay: number = 0) => {
    // This function will be called by each post rendered, so we delay the
    // recomputation until no post are rendered in 200ms to avoid unnecessary lag.
    const { listRef, cache, rowIndex, nuggetsManager } = this.props;
    cache.clear(rowIndex, 0);
    if (listRef) {
      let minRowIndex: number | null = listRef.minRowIndex; // minRowIndex from which to recompute row heights
      let timeoutId: TimeoutID | null = listRef.timeoutId;
      if (!minRowIndex) {
        listRef.minRowIndex = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      minRowIndex = Math.min(minRowIndex || rowIndex, rowIndex);
      timeoutId = setTimeout(() => {
        // if listRef.Grid is null, it means it has been unmounted, so we are now on a new List
        if (listRef.Grid) {
          // In Firefox (tested on version 59), recomputing row heights can jump back the page scroll
          // to the same post (The scrollTop from the Grid component is fine.),
          // potentially a post with a youtube video, but may be a coincidence.
          // Saving pageYOffset and restoring it after recomputeRowHeights fixes the issue.
          const pageYOffset = window.pageYOffset;
          listRef.recomputeRowHeights(minRowIndex);
          window.scrollTo({ top: pageYOffset, left: 0 });
          nuggetsManager.update();
          // recompute height only for rows (top post) starting at rowIndex
        }
        minRowIndex = null;
        timeoutId = null;
      }, delay);
    }
  };

  expandCollapse = (event: SyntheticEvent<HTMLDivElement>) => {
    event.stopPropagation();
    this.setState(
      state => ({ expanded: !state.expanded }),
      () => {
        this.resizeTreeHeight(0);
      }
    );
  };

  renderToggleLink = (expanded: boolean, indented: boolean) => (
    <div
      ref={this.scrollAnchor}
      onClick={(event) => {
        if (expanded) {
          this.scrollToElement();
        }
        this.expandCollapse(event);
      }}
      className={indented ? 'expand-indented' : 'expand'}
    >
      {expanded ? <span className="assembl-icon-minus-circled" /> : <span className="assembl-icon-plus-circled" />}
    </div>
  );

  scrollToElement = () => {
    scrollToPost(this.scrollAnchor);
  };

  render() {
    const {
      contentLocaleMapping,
      hidden,
      id,
      children,
      InnerComponent,
      InnerComponentFolded,
      level,
      originalLocale,
      rowIndex, // the index of the row (i.e. level 0 item) in the List
      SeparatorComponent,
      fullLevel,
      nuggetsManager,
      listRef,
      cache,
      identifier,
      phaseId
    } = this.props;
    const cssClasses = () => {
      let cls = `level level-${level}`;
      if (level > 0) {
        cls += ' border-left child-level';
      }
      if (level > 3) {
        cls += ' no-shift';
      }
      if (level > 4) {
        cls += ' padding-right';
      }
      if (hidden) {
        cls += ' hidden';
      }
      return cls;
    };
    const numChildren = children ? children.length : 0;
    const expanded = this.state.expanded;
    const contentLocale = contentLocaleMapping.getIn([id, 'contentLocale'], originalLocale);
    const forwardProps = {
      contentLocale: contentLocale,
      ...this.props,
      numChildren: numChildren
    };
    delete forwardProps.children;
    // InnerComponent, the post, is only rendered when the Child appears in the viewport or next page
    const { hash } = window.location;
    let visible = this.state.visible;
    // load right away the shared post
    let hashid;
    if (hash !== '') {
      hashid = hash.replace('#', '').split('?')[0];
      if (hashid === id) {
        visible = true;
      }
    }

    return (
      <div
        className={cssClasses()}
        id={id}
        ref={(el) => {
          this.holder = el;
          if (el && hashid === id) {
            scrollToPost(el, false);
          }
        }}
      >
        {visible ? (
          <InnerComponent {...forwardProps} measureTreeHeight={this.resizeTreeHeight} />
        ) : (
          <div style={{ height: 0.5 * window.innerHeight }} />
        )}
        {numChildren > 0 ? this.renderToggleLink(expanded, level < 4) : null}
        {numChildren > 0
          ? children.map((child, idx) => {
            const fullLevelArray: Array<string> = fullLevel ? fullLevel.split('-') : [];
            fullLevelArray[level] = `${idx}`;
            return (
              <Child
                hidden={!expanded}
                key={child.id}
                {...child}
                contentLocaleMapping={contentLocaleMapping}
                rowIndex={rowIndex}
                level={level + 1}
                InnerComponent={InnerComponent}
                InnerComponentFolded={InnerComponentFolded}
                SeparatorComponent={SeparatorComponent}
                fullLevel={fullLevelArray.join('-')}
                nuggetsManager={nuggetsManager}
                listRef={listRef}
                cache={cache}
                identifier={identifier}
                phaseId={phaseId}
              />
            );
          })
          : null}
        {numChildren > 0 && !expanded ? (
          <div
            className="postfolded-container"
            onClick={(event) => {
              if (expanded) {
                this.scrollToElement();
              }
              this.expandCollapse(event);
            }}
          >
            <div className="post-folded">
              <InnerComponentFolded nbPosts={numChildren} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default Child;