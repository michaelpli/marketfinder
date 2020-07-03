import React, {Component, PureComponent} from 'react';
import './App.scss';
import ReactMapGL, {NavigationControl, Marker} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import pin from './images/logosmall.png';

const mapbox_token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const navControlStyle = {
  position: 'absolute',
  bottom: 20,
  right: 0,
  padding: '10px'
};

const markets = [
  {id: 1, latitude: 37.0902, longitude: -95.7129},
  {id: 2, latitude: 37.1024, longitude: -95.9129},
]

class Markers extends PureComponent {
  render() {
    return this.props.markets.map(market => 
      <Marker 
        key={market.id} 
        latitude={market.latitude} 
        longitude={market.longitude}>
        <img src={pin} />
      </Marker>
    )
  }
}

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: 37.0902,
        longitude: -95.7129,
        zoom: 14,
        bearing: 0,
        pitch: 0,
      }
    };
  }

  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      position => {
        let viewport = {...this.state.viewport};
        viewport.latitude = position.coords.latitude;
        viewport.longitude = position.coords.longitude;
        this.setState({viewport})
      }, 
      err => console.log(err)
    );
  }

  render() {
    let {viewport} = this.state;
    return (
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewport => this.setState({viewport})}
        >
        <Markers markets={markets} />
        <div className="nav" style={navControlStyle}>
          <NavigationControl/>
        </div>
      </ReactMapGL>
    );
  }  
}

function App() {
  return (
    <Map/>
  );
}

export default App;
