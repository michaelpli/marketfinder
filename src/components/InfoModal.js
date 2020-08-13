import React from 'react';
import '../App.scss';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import pin from '../images/red-blue-marker.png';

export default function InfoModal(props) {
    const linkColor = "LightSeaGreen";
    return (
      <Modal
        {...props}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <img height={25} src={pin} />
          <Modal.Title id="contained-modal-title-vcenter">
            &nbsp; What is <i>marketfinder</i>?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h4>About</h4>
          <p style={{fontSize: 16}}>marketfinder is a web app that helps users easily access detailed information about their local farmers markets. 
            I love to shop at different farmers markets, but I’ve always found it difficult to figure out if a certain market 
            will have the specific foods I’m looking for, not to mention if it’s currently open for the season or not. In
            addition, many people are  simply unsure where to find the closest markets and are unaware of all the different
            products they have to offer. So, I created marketfinder to streamline the farmers market experience and to 
            encourage people to shop local.</p>
          <p style={{fontSize: 16}}>After searching for an area you want to explore, you’ll be able to interactively visualize the closest farmers 
            markets nearby and view details about the products they offer and the months they’ll be in season for.</p>
  
          <h4>Why Farmers Markets?</h4>
          <p style={{fontSize: 16}}>The fruits and veggies you buy at the farmers market are the freshest available. They’re brought directly to you: 
            no long-distance shipping, no gassing to simulate the ripening process, and no sitting for weeks in storage. </p>
          <p style={{fontSize: 16}}>They also contribute to protecting the environment. Food in the U.S. travels an average of 1,500 miles to get to 
            your plate. Cutting down on this shipping saves large amounts of natural resources, lowers pollution levels, and reduces 
            trash from excess packaging.</p>
          <p style={{fontSize: 16}}>Finally, shopping at farmers markets makes a big impact on family farmers. Now more than ever, small family farms 
            have a hard time competing in the food marketplace. Buying directly from farmers gives them a better return for their 
            produce and is a great way to support your community.</p>
  
          <h4>Technology</h4>
          <p style={{fontSize: 16}}>marketfinder is built with React (<a style = {{color: linkColor}} target="_new" href='https://create-react-app.dev/' >
              create-react-app</a>). Mapping capabilities are provided by <a style = {{color: linkColor}} target="_new" 
              href='https://www.mapbox.com/'>MapBox</a>, and detailed farmers 
            market data is sourced from the USDA Farmers Market Directory <a style = {{color: linkColor}} target="_new" 
              href='https://www.ams.usda.gov/local-food-directories/farmersmarkets'>API</a>. <a style = {{color: linkColor}} target="_new" 
              href='https://react-bootstrap.netlify.app/'>React-Bootstrap</a> for styling, hosted by <a style = {{color: linkColor}} target="_new" 
              href='https://www.heroku.com'>Heroku</a>. 
            Feel free to check out the source code on my <a style = {{color: linkColor}} target="_new" 
              href='https://www.github.com/michaelpli'>GitHub</a>.</p>
  
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={props.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }