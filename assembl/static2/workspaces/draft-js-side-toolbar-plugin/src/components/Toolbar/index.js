/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
// import debounce from 'lodash/debounce';
import DraftOffsetKey from 'draft-js/lib/DraftOffsetKey';
import {
  BlockquoteButton,
  CodeBlockButton,
  HeadlineOneButton,
  HeadlineTwoButton,
  OrderedListButton,
  UnorderedListButton,
} from 'draft-js-buttons';
import BlockTypeSelect from '../BlockTypeSelect';
import type { SideToolbarProps } from '../../index';

class Toolbar extends React.Component<SideToolbarProps> {

  static defaultProps = {
    children: (externalProps) => (
      // may be use React.Fragment instead of div to improve perfomance after React 16
      <div>
        <HeadlineOneButton {...externalProps} />
        <HeadlineTwoButton {...externalProps} />
        <BlockquoteButton {...externalProps} />
        <CodeBlockButton {...externalProps} />
        <UnorderedListButton {...externalProps} />
        <OrderedListButton {...externalProps} />
      </div>
    )
  }

  state = {
    position: {
      transform: 'scale(0)',
    }
  }

  constructor(props) {
    super(props);
    this.toolbarRef = React.createRef();
  }

  componentDidMount() {
    // document.addEventListener('scroll', this.trackScrolling);
    this.props.store.subscribeToItem('editorState', this.onEditorStateChange);
  }

  componentWillUnmount() {
    // document.removeEventListener('scroll', this.trackScrolling);
    this.props.store.unsubscribeFromItem('editorState', this.onEditorStateChange);
  }


  onEditorStateChange = (editorState) => {
    const selection = editorState.getSelection();
    if (!selection.getHasFocus()) {
      this.setState({
        position: {
          transform: 'scale(0)',
        },
      });
      return;
    }

    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(selection.getStartKey());
    // TODO verify that always a key-0-0 exists
    const offsetKey = DraftOffsetKey.encode(currentBlock.getKey(), 0, 0);
    // Note: need to wait on tick to make sure the DOM node has been create by Draft.js
    setTimeout(() => {
      const focusedLineNode = document.querySelectorAll(`[data-offset-key="${offsetKey}"]`)[0];
      // The editor root should be two levels above the node from
      // `getEditorRef`. In case this changes in the future, we
      // attempt to find the node dynamically by traversing upwards.
      this.setPosition(this.topPositionFromFocusedLine(focusedLineNode));
    }, 0);
  };

  setPosition(topPosition: number) {
    const position = {
      top: topPosition,
      transform: 'scale(1)',
      transition: 'transform 0.15s cubic-bezier(.3,1.2,.2,1)',
    };
    // TODO: remove the hard code(width for the hover element)
    const { store } = this.props;
    const editorRef = store.getItem('getEditorRef')();
    if (!editorRef) return;
    let editorRoot = editorRef.refs && editorRef.refs.editor
      ? editorRef.refs.editor : editorRef.editor;
    while (editorRoot.className.indexOf('DraftEditor-root') === -1) {
      editorRoot = editorRoot.parentNode;
    }
    if (this.props.position === 'right') {
      // eslint-disable-next-line no-mixed-operators
      position.left = editorRoot.offsetLeft + editorRoot.offsetWidth + 80 - 36;
    } else {
      position.left = editorRoot.offsetLeft - 80;
    }
    const editorScrollTop = editorRoot.querySelector(".public-DraftEditor-content").scrollTop;
    position.top = position.top - editorScrollTop;

    this.setState({
      position,
    });
  }

  topPositionFromFocusedLine(focusedLineNode) {
    return focusedLineNode.offsetTop;
  }

  // trackScrolling = debounce(() => {
  //   const toolbarNode = this.toolbarRef.current;
  //   if (toolbarNode) {
  //     const clientRectTop = toolbarNode.getBoundingClientRect().top;
  //     if (clientRectTop < 60) {
  //       console.log('toolbar top reached');
  //       this.setPosition(60);
  //     }
  //   }
  // }, 100);

  render() {
    const { theme, store, dropDown } = this.props;

    return (
      <div ref={this.toolbarRef}
           className={theme.toolbarStyles.wrapper}
           style={this.state.position}
      >
        <BlockTypeSelect
          getEditorState={store.getItem('getEditorState')}
          setEditorState={store.getItem('setEditorState')}
          theme={theme}
          dropDown={dropDown}
        >
          {this.props.children}
        </BlockTypeSelect>
      </div>
    );
  }
}

Toolbar.propTypes = {
  children: PropTypes.func
};

export default Toolbar;