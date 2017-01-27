import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import Header from '../components/home/header';
import PartnersSection from '../components/home/partnersSection';

class Home extends React.Component {
  render() {
    return (
      <div>
        <Header />
        <Grid fluid className="background-grey">
          <div className="max-container">
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'justify', marginTop: `${50}px`, marginBottom: `${50}px` }}>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a lacus sit amet nunc condimentum imperdiet sit amet et tellus. Fusce pellentesque turpis non nisl vestibulum, vitae malesuada ex scelerisque. Sed eu urna non mauris luctus consequat. Nulla mauris quam, maximus non sem ac, vulputate pulvinar sapien. Donec quis ligula augue. Quisque a risus id lorem porta egestas vitae vitae ipsum. Duis ac enim eu turpis facilisis gravida eu et urna. Aenean fringilla sem et nisi dictum vestibulum. In dictum sem commodo dolor consectetur pellentesque. Aliquam elit mauris, volutpat ut pellentesque eget, efficitur nec turpis. Aenean auctor risus efficitur, interdum ligula id, porttitor nunc. Maecenas egestas erat a arcu lacinia, vel efficitur orci lobortis. Morbi massa enim, luctus nec ullamcorper finibus, facilisis et ligula. Aenean porttitor lacinia nisl rhoncus elementum.</p>
                <p>Ut vulputate fermentum hendrerit. Phasellus molestie posuere nibh eget suscipit. In sollicitudin lacus eget velit cursus rhoncus. Etiam sagittis luctus lacus id cursus. Donec viverra lorem vitae libero iaculis venenatis. Etiam tincidunt tincidunt urna a efficitur. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris iaculis eget nulla et scelerisque. Maecenas turpis ex, aliquet nec tempus vel, sodales eu ipsum. Maecenas consequat dui non purus tincidunt consectetur. Etiam velit orci, lobortis at malesuada venenatis, fringilla finibus nunc. Nullam non nibh faucibus, porta massa at, aliquet mauris. Sed ut commodo ex, non luctus ligula. Ut luctus enim sapien, a cursus erat maximus nec. Nulla vitae semper felis, mattis tempus purus.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a lacus sit amet nunc condimentum imperdiet sit amet et tellus. Fusce pellentesque turpis non nisl vestibulum, vitae malesuada ex scelerisque. Sed eu urna non mauris luctus consequat. Nulla mauris quam, maximus non sem ac, vulputate pulvinar sapien. Donec quis ligula augue. Quisque a risus id lorem porta egestas vitae vitae ipsum. Duis ac enim eu turpis facilisis gravida eu et urna. Aenean fringilla sem et nisi dictum vestibulum. In dictum sem commodo dolor consectetur pellentesque. Aliquam elit mauris, volutpat ut pellentesque eget, efficitur nec turpis. Aenean auctor risus efficitur, interdum ligula id, porttitor nunc. Maecenas egestas erat a arcu lacinia, vel efficitur orci lobortis. Morbi massa enim, luctus nec ullamcorper finibus, facilisis et ligula. Aenean porttitor lacinia nisl rhoncus elementum.</p>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'justify', marginTop: `${50}px`, marginBottom: `${50}px` }}>
                <p>Ut vulputate fermentum hendrerit. Phasellus molestie posuere nibh eget suscipit. In sollicitudin lacus eget velit cursus rhoncus. Etiam sagittis luctus lacus id cursus. Donec viverra lorem vitae libero iaculis venenatis. Etiam tincidunt tincidunt urna a efficitur. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris iaculis eget nulla et scelerisque. Maecenas turpis ex, aliquet nec tempus vel, sodales eu ipsum. Maecenas consequat dui non purus tincidunt consectetur. Etiam velit orci, lobortis at malesuada venenatis, fringilla finibus nunc. Nullam non nibh faucibus, porta massa at, aliquet mauris. Sed ut commodo ex, non luctus ligula. Ut luctus enim sapien, a cursus erat maximus nec. Nulla vitae semper felis, mattis tempus purus.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a lacus sit amet nunc condimentum imperdiet sit amet et tellus. Fusce pellentesque turpis non nisl vestibulum, vitae malesuada ex scelerisque. Sed eu urna non mauris luctus consequat. Nulla mauris quam, maximus non sem ac, vulputate pulvinar sapien. Donec quis ligula augue. Quisque a risus id lorem porta egestas vitae vitae ipsum. Duis ac enim eu turpis facilisis gravida eu et urna. Aenean fringilla sem et nisi dictum vestibulum. In dictum sem commodo dolor consectetur pellentesque. Aliquam elit mauris, volutpat ut pellentesque eget, efficitur nec turpis. Aenean auctor risus efficitur, interdum ligula id, porttitor nunc. Maecenas egestas erat a arcu lacinia, vel efficitur orci lobortis. Morbi massa enim, luctus nec ullamcorper finibus, facilisis et ligula. Aenean porttitor lacinia nisl rhoncus elementum.</p>
                <p>Ut vulputate fermentum hendrerit. Phasellus molestie posuere nibh eget suscipit. In sollicitudin lacus eget velit cursus rhoncus. Etiam sagittis luctus lacus id cursus. Donec viverra lorem vitae libero iaculis venenatis. Etiam tincidunt tincidunt urna a efficitur. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris iaculis eget nulla et scelerisque. Maecenas turpis ex, aliquet nec tempus vel, sodales eu ipsum. Maecenas consequat dui non purus tincidunt consectetur. Etiam velit orci, lobortis at malesuada venenatis, fringilla finibus nunc. Nullam non nibh faucibus, porta massa at, aliquet mauris. Sed ut commodo ex, non luctus ligula. Ut luctus enim sapien, a cursus erat maximus nec. Nulla vitae semper felis, mattis tempus purus.</p>
              </div>
            </Col>
          </div>
        </Grid>
        <PartnersSection />
      </div>
    );
  }
}

export default Home;