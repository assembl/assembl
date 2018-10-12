// @flow
import * as React from 'react';
import type { ContentBlock, ContentState } from 'draft-js';

type Props = {
  block: ContentBlock,
  contentState: ContentState
};

type State = {
  filename: string,
  src: string
};

class Image extends React.Component<Props, State> {
  state = {
    filename: '',
    src: ''
  };

  componentDidMount() {
    this.updateState(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    this.updateState(nextProps);
  }

  updateState = (props: Props) => {
    const { block, contentState } = props;
    const entityKey = block.getEntityAt(0);
    const entity = contentState.getEntity(entityKey);
    const data = entity.getData();
    const fileOrUrl = data.src;
    if (fileOrUrl && fileOrUrl instanceof File) {
      const file = fileOrUrl;
      const reader = new FileReader();
      const filename = file.name || data.title;
      reader.addEventListener(
        'loadend',
        () => {
          this.setState({
            filename: filename,
            // $FlowFixMe we know that reader.result is a string as we used readAsDataUrl
            src: reader.result
          });
        },
        false
      );

      if (file) {
        reader.readAsDataURL(fileOrUrl);
      }
    } else if (typeof fileOrUrl === 'string') {
      this.setState({ filename: data.title, src: fileOrUrl });
    }
  };

  render() {
    const { filename, src } = this.state;
    return (
      <div className="atomic-block" data-blocktype="atomic">
        {src ? <img className="attachment-image" src={src} alt={filename} title={filename} /> : null}
      </div>
    );
  }
}

export default Image;