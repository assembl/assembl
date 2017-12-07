/* eslint react/no-multi-comp: "off" */

import React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';
import { getDomElementOffset } from '../../utils/globalFunctions';
import NuggetsManager from './nuggetsManager';

class Child extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderToggleLink = this.renderToggleLink.bind(this);
    this.expandCollapse = this.expandCollapse.bind(this);
    this.resizeTreeHeight = this.resizeTreeHeight.bind(this);
    this.scrollToElement = this.scrollToElement.bind(this);
    this.state = { expanded: true };
  }

  resizeTreeHeight(delay = 0) {
    // This function will be called by each post rendered, so we delay the
    // recomputation until no post are rendered in 200ms to avoid unnecessary lag.
    const { listRef, cache, rowIndex, nuggetsManager } = this.props;
    cache.clear(rowIndex, 0);
    if (listRef) {
      let delayedRecomputeRowHeights = listRef.delayedRecomputeRowHeights;
      if (!delayedRecomputeRowHeights) {
        delayedRecomputeRowHeights = [null, null]; // [timeoutId, minRowIndex from which to recompute row heights]
        listRef.delayedRecomputeRowHeights = delayedRecomputeRowHeights;
      }
      if (delayedRecomputeRowHeights[0]) {
        clearTimeout(delayedRecomputeRowHeights[0]);
      }
      delayedRecomputeRowHeights[1] = Math.min(delayedRecomputeRowHeights[1] || rowIndex, rowIndex);
      delayedRecomputeRowHeights[0] = setTimeout(() => {
        // if listRef.Grid is null, it means it has been unmounted, so we are now on a new List
        if (listRef.Grid) {
          listRef.recomputeRowHeights(delayedRecomputeRowHeights[1]);
          nuggetsManager.update();
          // recompute height only for rows (top post) starting at rowIndex
        }
        delayedRecomputeRowHeights[0] = null;
        delayedRecomputeRowHeights[1] = null;
      }, delay);
    }
  }

  expandCollapse(event) {
    event.stopPropagation();
    this.setState(
      state => ({ expanded: !state.expanded }),
      () => {
        this.resizeTreeHeight(0);
      }
    );
  }

  renderToggleLink(expanded, indented) {
    return (
      <div
        ref={(el) => {
          this.scrollAnchor = el;
        }}
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
  }

  scrollToElement() {
    const elmOffset = getDomElementOffset(this.scrollAnchor).top - 80;
    window.scrollTo({ top: elmOffset, left: 0, behavior: 'smooth' });
  }

  render() {
    const {
      contentLocaleMapping,
      hidden,
      id,
      lang,
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
      identifier
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
    return (
      <div className={cssClasses()} id={id}>
        <InnerComponent {...forwardProps} measureTreeHeight={this.resizeTreeHeight} />
        {numChildren > 0 ? this.renderToggleLink(expanded, level < 4) : null}
        {numChildren > 0
          ? children.map((child, idx) => {
            const fullLevelArray = 'fullLevel' in this.props ? fullLevel.split('-') : [];
            fullLevelArray[level] = idx;
            return (
              <Child
                hidden={!expanded}
                key={child.id}
                {...child}
                contentLocaleMapping={contentLocaleMapping}
                lang={lang}
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
Child.defaultProps = {
  level: 0,
  hidden: false
};

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.nuggetsManager = new NuggetsManager();
    this.prevStopIndex = 0;
    this.cache = new CellMeasurerCache({
      defaultHeight: 500,
      minHeight: 185,
      fixedWidth: true
    });
  }

  componentDidMount() {
    // Reset the global prevStopIndex to not overfetch posts when changing idea
    // or to avoid recreating all dom nodes if we go back to the same idea.
    this.cache.clearAll();
    this.prevStopIndex = 0;

    if (this.props.initialRowIndex !== null) {
      this.listRef.scrollToRow(this.props.initialRowIndex);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data.length !== nextProps.data.length) {
      this.cache.clearAll();
      // If a new top post has been created, clear the cache
      // and rerender the List by changing its key
      // to be sure to recalculate the heights of all top posts.
      // Reset prevStopIndex because globalList.recomputeRowHeights() only update the 10 first top posts
      // because Grid.recomputeGridSize that is called by globalList.recomputeRowHeights
      // doesnt take into account our hack in overscanIndicesGetter.
      // This means that the posts after the 10th post are removed from the dom
      // and will be recreated when scrolling, losing the previous expand/collapse local state.
      this.prevStopIndex = 0;
    }
  }

  // override overscanIndicesGetter to not remove from the dom the posts once rendered
  // to fix various issue with scrolling with WindowScroller
  overscanIndicesGetter = ({ cellCount, overscanCellsCount, stopIndex }) => {
    let overscanStopIndex;
    if (cellCount === 1) {
      // overscanIndicesGetter is called for columns, not rows
      // use default implementation
      overscanStopIndex = Math.min(cellCount - 1, stopIndex + overscanCellsCount);
    } else {
      this.prevStopIndex = Math.max(this.prevStopIndex, stopIndex);
      overscanStopIndex = Math.min(cellCount - 1, this.prevStopIndex + overscanCellsCount);
    }
    return {
      overscanStartIndex: 0,
      overscanStopIndex: overscanStopIndex
    };
  };

  cellRenderer = ({ index, key, parent, style }) => {
    const {
      data,
      InnerComponent, // component that will be rendered in the child
      InnerComponentFolded, // component that will be used to render the children when folded
      SeparatorComponent, // separator component between first level children
      identifier
    } = this.props;

    const childData = data[index];
    return (
      <CellMeasurer cache={this.cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        <div style={style}>
          {index > 0 ? <SeparatorComponent /> : null}
          <Child
            {...childData}
            contentLocaleMapping={parent.props.contentLocaleMapping}
            key={childData.id}
            lang={parent.props.lang}
            rowIndex={index}
            InnerComponent={InnerComponent}
            InnerComponentFolded={InnerComponentFolded}
            SeparatorComponent={SeparatorComponent}
            nuggetsManager={this.nuggetsManager}
            listRef={this.listRef}
            cache={this.cache}
            identifier={identifier}
          />
        </div>
      </CellMeasurer>
    );
  };

  render() {
    const { contentLocaleMapping, data, lang, noRowsRenderer } = this.props;
    return (
      <WindowScroller>
        {({ height, isScrolling, onChildScroll, scrollTop }) => (
          <AutoSizer
            disableHeight
            onResize={() => {
              this.cache.clearAll();
              this.listRef.recomputeRowHeights();
              this.nuggetsManager.update();
            }}
          >
            {({ width }) => (
              <List
                contentLocaleMapping={contentLocaleMapping}
                height={height}
                // pass lang to the List component to ensure that the rows are rendered again if we change the site language
                lang={lang}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                scrollTop={scrollTop}
                autoHeight
                rowHeight={this.cache.rowHeight}
                deferredMeasurementCache={this.cache}
                noRowsRenderer={noRowsRenderer}
                ref={(ref) => {
                  // Add a guard because the List component's ref is recalculated many times onScroll
                  // Causing other components that have listRef as prop to re-render 4x-6x times.
                  if (!this.listRef) {
                    this.listRef = ref;
                  }
                }}
                rowCount={data.length}
                overscanIndicesGetter={this.overscanIndicesGetter}
                overscanRowCount={1}
                rowRenderer={this.cellRenderer}
                width={width}
                className="tree-list"
              />
            )}
          </AutoSizer>
        )}
      </WindowScroller>
    );
  }
}

Tree.defaultProps = {
  InnerComponentFolded: () => null
};

export default Tree;