/*
  `aux` component is a high order component used to
  avoid meaningless `div` tag in a component that
  is already wrapped in an other component

  example :
    <div><h1>Title</h1><p>Content</p></div>
    would generate
    <div><h1>Title</h1><p>Content</p></div>

    <Aux><h1>Title</h1><p>Content</p></Aux>
    would generate
    <h1>Title</h1><p>Content</p>
*/
const aux = props => props.children;

export default aux;