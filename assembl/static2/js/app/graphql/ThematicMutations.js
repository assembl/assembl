import { gql } from 'react-apollo';

export const createThematic = gql`
  mutation createThematic($identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!, $questions: [QuestionInput], $video: VideoInput) {
    createThematic(identifier: $identifier, image: $image, titleEntries: $titleEntries, questions: $questions, video: $video) {
      thematic {
        title,
        imgUrl,
        video {
          title,
          description,
          htmlCode
        },
        questions {
          title
        }
      }
    }
  }
`;

export const updateThematic = gql`
  mutation updateThematic($id:ID!, $identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!, $questions: [QuestionInput], $video: VideoInput) {
    updateThematic(id:$id, identifier: $identifier, image: $image, titleEntries: $titleEntries, questions: $questions, video: $video) {
      thematic {
        title,
        imgUrl,
        video {
          title,
          description,
          htmlCode
        },
        questions {
          title
        }
      }
    }
  }
`;

export const deleteThematic = gql`
  mutation deleteThematic($thematicId: ID!) {
    deleteThematic(thematicId: $thematicId) {
      success
    }
  }
`;