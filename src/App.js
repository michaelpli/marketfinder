import React, {Component} from 'react';
import './App.scss';
import MapGL, {NavigationControl} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'

const mapbox_token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const navControlStyle = {
  position: 'absolute',
  bottom: 20,
  right: 0,
  padding: '10px'
};

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: 42.3601,
        longitude: -71.0589,
        zoom: 14,
        bearing: 0,
        pitch: 0,
      }
    };
  }

  render() {
    const {viewport} = this.state;
    return (
      <MapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewport => this.setState({viewport})}
        >
        <div className="nav" style={navControlStyle}>
          <NavigationControl/>
        </div>
      </MapGL>
    );
  }  
}

function App() {
  return (
    <Map/>
  );
}

export default App;
