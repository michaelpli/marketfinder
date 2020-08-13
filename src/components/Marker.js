import React, {PureComponent} from 'react';
import '../App.scss';
import pin from '../images/red-blue-marker.png';
import {Marker} from 'react-map-gl';

class MyMarker extends PureComponent{
    constructor(props) {
      super(props);
      this.state = {
        popupInfo: null
      }
    }
  
    render() {
      let market = this.props.market;
      let GMapsLink = market.marketDetails.GoogleLink;
      let coords = parseGMapsLink(GMapsLink);
      market = {...market, coords: coords};
      const SIZE = 35;
      return (
          <Marker
            key={market.id} 
            latitude={coords.lat} 
            longitude={coords.long}>
              <img 
              className="PinImage"
              height={SIZE}
              viewBox="0 0 30 30"
              src={pin} 
              style={{
                cursor: 'pointer',
                fill: '#d00',
                stroke: 'none',
                transform: `translate(${-SIZE/2}px,${-SIZE}px)`,
              }}
               onMouseEnter={() => this.props.onEnter(market)}  
               onMouseLeave={() => this.props.onLeave()}
              > 
              </img>
          </Marker>
      );
    }
}

//example link: 'http://maps.google.com/?q=42.066418%2C%20-87.937294%20(%22Mt.+Prospect+Farmers+Market%22)'
function parseGMapsLink(GMapsLink) {
    let tempBoth = GMapsLink.split('%2C%20');
    let tempLat = tempBoth[0].split('=');
    let lat = parseFloat(tempLat[1]);
    let tempLong = tempBoth[1].split('%20');
    let long = parseFloat(tempLong[0]);
    return {lat: lat, long: long};
}

export default MyMarker;