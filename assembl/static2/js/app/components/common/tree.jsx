/* eslint react/no-multi-comp: "off" */

import React from 'react';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, WindowScroller } from 'react-virtualized';
import { getDomElementOffset, scrollToPosition } from '../../utils/globalFunctions';

/*
  TODO: avoid globalList
  TODO: InnerComponentFolded should be able to toggle the item
*/

let globalList;

const cache = new CellMeasurerCache({
  defaultHeight: 500,
  minHeight: 355,
  fixedWidth: true
});

let prevStopIndex = 0;
// override overscanIndicesGetter to not remove from the dom the posts once rendered
// to fix various issue with scrolling with WindowScroller
function overscanIndicesGetter({ cellCount, overscanCellsCount, stopIndex }) {
  let overscanStopIndex;
  if (cellCount === 1) {
    // overscanIndicesGetter is called for columns, not rows
    // use default implementation
    overscanStopIndex = Math.min(cellCount - 1, stopIndex + overscanCellsCount);
  } else {
    prevStopIndex = Math.max(prevStopIndex, stopIndex);
    overscanStopIndex = Math.min(cellCount - 1, prevStopIndex + overscanCellsCount);
  }
  return {
    overscanStartIndex: 0,
    overscanStopIndex: overscanStopIndex
  };
}

const delayedRecomputeRowHeights = [null, null]; // [timeoutId, minRowIndex from which to recompute row heights]

const resizeTreeHeight = (rowIndex, delay = 200) => {
  // This function will be called by each post rendered, so we delay the
  // recomputation until no post are rendered in 200ms to avoid unnecessary lag.
  if (globalList) {
    cache.clear(rowIndex, 0);
    if (delayedRecomputeRowHeights[0]) {
      clearTimeout(delayedRecomputeRowHeights[0]);
    }
    delayedRecomputeRowHeights[1] = Math.min(delayedRecomputeRowHeights[1] || rowIndex, rowIndex);
    delayedRecomputeRowHeights[0] = setTimeout(() => {
      delayedRecomputeRowHeights[0] = null;
      delayedRecomputeRowHeights[1] = null;
      if (globalList) {
        globalList.recomputeRowHeights(delayedRecomputeRowHeights[1]);
        // recompute height only for rows (top post) starting at rowIndex
      }
    }, delay);
  }
};

class Child extends React.PureComponent {
  constructor(props) {
    super(props);
    this.renderToggleLink = this.renderToggleLink.bind(this);
    this.expandCollapse = this.expandCollapse.bind(this);
    this.resizeTreeHeight = this.resizeTreeHeight.bind(this);
    this.scrollToElement = this.scrollToElement.bind(this);
    this.state = { expanded: true };
  }

  resizeTreeHeight(delay = 200) {
    resizeTreeHeight(this.props.rowIndex, delay);
  }

  expandCollapse(event) {
    event.stopPropagation();
    this.setState(
      (state) => {
        return { expanded: !state.expanded };
      },
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
    const elmOffset = getDomElementOffset(this.scrollAnchor).top - 20;
    scrollToPosition(elmOffset, 200);
  }

  render() {
    const {
      hidden,
      lang,
      activeAnswerFormId,
      children,
      InnerComponent,
      InnerComponentFolded,
      level,
      rowIndex, // the index of the row (i.e. level 0 item) in the List
      SeparatorComponent
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
    const forwardProps = { ...this.props };
    delete forwardProps.activeAnswerFormId;
    delete forwardProps.children;
    return (
      <div className={cssClasses()}>
        <InnerComponent
          {...forwardProps}
          needToShowAnswerForm={activeAnswerFormId === this.props.id}
          measureTreeHeight={this.resizeTreeHeight}
        />
        {numChildren > 0 ? this.renderToggleLink(expanded, level < 4) : null}
        {numChildren > 0
          ? children.map((child, idx) => {
            return (
              <Child
                hidden={!expanded}
                key={idx}
                {...child}
                lang={lang}
                activeAnswerFormId={activeAnswerFormId}
                rowIndex={rowIndex}
                level={level + 1}
                InnerComponent={InnerComponent}
                InnerComponentFolded={InnerComponentFolded}
                SeparatorComponent={SeparatorComponent}
              />
            );
          })
          : null}
        {numChildren > 0 && !expanded
          ? <div
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
          : null}
      </div>
    );
  }
}
Child.defaultProps = {
  level: 0,
  hidden: false
};

const cellRenderer = ({ index, key, parent, style }) => {
  const { lang, activeAnswerFormId, data, InnerComponent, InnerComponentFolded, SeparatorComponent } = parent.props;
  const childData = data[index];
  return (
    <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
      <div style={style}>
        {index > 0 ? <SeparatorComponent /> : null}
        <Child
          {...childData}
          lang={lang}
          activeAnswerFormId={activeAnswerFormId}
          rowIndex={index}
          InnerComponent={InnerComponent}
          InnerComponentFolded={InnerComponentFolded}
          SeparatorComponent={SeparatorComponent}
        />
      </div>
    </CellMeasurer>
  );
};

class Tree extends React.Component {
  componentDidMount() {
    // Reset the global prevStopIndex to not overfetch posts when changing idea
    // or to avoid recreating all dom nodes if we go back to the same idea.
    cache.clearAll();
    prevStopIndex = 0;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.data.length !== nextProps.data.length) {
      cache.clearAll();
      // If a new top post has been created, clear the cache
      // and rerender the List by changing its key
      // to be sure to recalculate the heights of all top posts.
      // Reset prevStopIndex because globalList.recomputeRowHeights() only update the 10 first top posts
      // because Grid.recomputeGridSize that is called by globalList.recomputeRowHeights
      // doesnt take into account our hack in overscanIndicesGetter.
      // This means that the posts after the 10th post are removed from the dom
      // and will be recreated when scrolling, losing the previous expand/collapse local state.
      prevStopIndex = 0;
    }
  }

  render() {
    const {
      lang,
      activeAnswerFormId,
      data,
      InnerComponent, // component that will be rendered in the child
      InnerComponentFolded, // component that will be used to render the children when folded
      noRowsRenderer,
      SeparatorComponent // separator component between first level children
    } = this.props;
    return (
      <WindowScroller>
        {({ height, isScrolling, onChildScroll, scrollTop }) => {
          return (
            <AutoSizer
              disableHeight
              onResize={() => {
                cache.clearAll();
                globalList.recomputeRowHeights();
              }}
            >
              {({ width }) => {
                return (
                  <List
                    key={data.length}
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    scrollTop={scrollTop}
                    autoHeight
                    rowHeight={cache.rowHeight}
                    deferredMeasurementCache={cache}
                    lang={lang}
                    activeAnswerFormId={activeAnswerFormId}
                    data={data}
                    InnerComponent={InnerComponent}
                    InnerComponentFolded={InnerComponentFolded}
                    noRowsRenderer={noRowsRenderer}
                    ref={function (ref) {
                      globalList = ref;
                    }}
                    rowCount={data.length}
                    overscanIndicesGetter={overscanIndicesGetter}
                    overscanRowCount={10}
                    rowRenderer={cellRenderer}
                    SeparatorComponent={SeparatorComponent}
                    width={width}
                    className="tree-list"
                  />
                );
              }}
            </AutoSizer>
          );
        }}
      </WindowScroller>
    );
  }
}

Tree.defaultProps = {
  InnerComponentFolded: () => {
    return null;
  }
};

export default Tree;