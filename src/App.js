import React, {Component, PureComponent} from 'react';
import './App.scss';
import ReactMapGL, {NavigationControl, Marker} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css'
import pin from './images/logosmall.png';
const axios = require('axios');

const mapbox_token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const navControlStyle = {
  position: 'absolute',
  bottom: 20,
  right: 0,
  padding: '10px'
};

async function getMarkets(lat, long) {
  let response = await axios.get('https://search.ams.usda.gov/farmersmarkets/v1/data.svc/locSearch?lat='+lat+'&lng='+long, {})
    .then((response) => {
    console.log(response.status);
    console.log(response.data);
    return response;
  }, (error) => {
    console.log(error);
  });
  console.log(response.data.results)
  return response.data.results //JSONArray
}

class Markers extends PureComponent {
  render() {
    return this.props.markets.map(market => 
      <Marker 
        key={market.id} 
        latitude={42.3318} 
        longitude={-71.1212}>
        <img src={pin} />
        <div>{market.marketname}</div>
      </Marker>
    )
  }
}

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: null,
        longitude: null,
        zoom: 14,
        bearing: 0,
        pitch: 0,
      },
      markets: null
    };
  }

  async componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      async position => {
        let viewport = {...this.state.viewport};
        viewport.latitude = position.coords.latitude;
        viewport.longitude = position.coords.longitude;
        this.setState({viewport});

        //load markets here
        let marketList = await getMarkets(position.coords.latitude, position.coords.longitude);
        this.setState({markets: marketList});
      }, 
      err => console.log(err)
    );
  }

  render() {
    let {viewport} = this.state;
    if (!viewport.latitude || !viewport.longitude || !this.state.markets) {
      return <div>Loading...</div> //TODO replace with loading screen
    }
    return (
      <ReactMapGL
        {...viewport}
        mapboxApiAccessToken={mapbox_token}
        width = '100vw'
        height = '100vh'
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewport => this.setState({viewport})}
        >
        <Markers markets={this.state.markets} />
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
