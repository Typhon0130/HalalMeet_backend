import React,{ useState, useEffect, useRef } from 'react';
import PlacesAutocomplete from 'react-places-autocomplete';
import {
  geocodeByAddress,
  geocodeByPlaceId,
  getLatLng,
} from 'react-places-autocomplete';
import axios from 'axios';
import { env } from 'admin-bro'
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const NewGooglePlaces = () => {
  const [address, setAddress] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [options , setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [radius, changeRadius] = useState(5000);
  const [keyword, setKeyword] = useState();
  const [country, setCountry] = useState('');
  const [rankby, setRankby] = useState('prominence');
  const [nrOfResults, setNrOfResults] = useState(1);
  const [radiusHidden, setRadiusHidden] = useState(false);
  const [latlong, setLatlong] = useState();
  const firstUpdate = useRef(true);
  const placeTypesOptions = ['accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery', 'atm', 'bakery', 'bank', 'bar', 'beauty_salon', 'bicycle_store', 'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground', 'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'casino', 'cemetery', 'church', 'city_hall', 'clothing_store', 'convenience_store', 'courthouse', 'dentist', 'department_store', 'doctor', 'drugstore', 'electrician', 'electronics_store', 'embassy', 'fire_station', 'florist', 'funeral_home', 'furniture_store', 'gas_station', 'gym', 'hair_care', 'hardware_store', 'hindu_temple', 'home_goods_store', 'hospital', 'insurance_agency', 'jewelry_store', 'laundry', 'lawyer', 'library', 'light_rail_station', 'liquor_store', 'local_government_office', 'locksmith', 'lodging', 'meal_delivery', 'meal_takeaway', 'mosque', 'movie_rental', 'movie_theater', 'moving_company', 'museum', 'night_club', 'painter', 'park', 'parking', 'pet_store', 'pharmacy', 'physiotherapist', 'plumber', 'police', 'post_office', 'primary_school', 'real_estate_agency', 'restaurant', 'roofing_contractor', 'rv_park', 'school', 'secondary_school', 'shoe_store', 'shopping_mall', 'spa', 'stadium', 'storage', 'store', 'subway_station', 'supermarket', 'synagogue', 'taxi_stand', 'tourist_attraction', 'train_station', 'transit_station', 'travel_agency', 'university', 'veterinary_care', 'zoo'];

  useEffect(() => {
    (async () => {
      try {
        const mappedRes = placeTypesOptions.map((item) => ({
          label: item,
          value: item,
        }));
        setOptions(mappedRes);
      } catch(e) {
        console.log(e);
      }
    })();

    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBgc5jrMztaPkElgYYuqqdyiNA17Le7omg&libraries=places";
    document.body.appendChild(script);

    setTimeout(() => {
      setScriptLoaded(true); // Todo
    }, 1000);

    return () => {
      document.body.removeChild(script);
    }
  }, []);

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (rankby === 'distance') {
      setRadiusHidden(true);
      changeRadius('');
    } else {
      setRadiusHidden(false);
    }
  }, [rankby]);

  const handleChange = address => {
    setAddress(address);
  };

  const handleSelect = address => {
    geocodeByAddress(address)
        .then(results => {
          setAddress(results[0].formatted_address)
          setLatlong({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          })
        })
        .catch(error => console.error('Error', error));
  };

  const handleMeters = (e) => {
    changeRadius(e.target.value);
  }

  const submit = async () => {
      try {
        const splitAdr = address.split(', ')
        if (radiusHidden) {
          if (latlong) {
            const {lat,lng} = latlong;
            console.log(address.split(', '))
            const res = await axios.post(env.API_URL + '/admin/create-google-places', {
              lat: lat,
              long: lng,
              radius: radius,
              type: selected.map(item => (item.value)),
              rankby: rankby,
              keyword: keyword,
              city: splitAdr[0],
              country: country,
              nrOfResults
            });
            alert('Google places created');
            window.location.href = env.BASE_URL + "/resources/GooglePlaces";
          } else {
            alert('Select a place');
          }
        } else if (!radiusHidden) {
          if (radius && latlong) {
            const {lat,lng} = latlong;
            const res = await axios.post(env.API_URL + '/admin/create-google-places', {
              lat: lat,
              long: lng,
              radius: radius,
              type: selected.map(item => (item.value)),
              rankby: rankby,
              keyword: keyword,
              city: splitAdr[0],
              country: country,
              nrOfResults
            });
            alert('Google places created');
            window.location.href = env.BASE_URL + "/resources/GooglePlaces";
          } else {
            alert('Fill radius and select a place');
          }
        }
      } catch(e) {
        console.log(e);
      }
  }

  const handleRankby = (e) => {
    setRankby(e.target.value);
  }

  const handleKeyword = (e) => {
    setKeyword(e.target.value);
  }

  const handleCountry = (e) => {
    setCountry(e.target.value);
  }

  const handleNrOfResults = (e) => {
    setNrOfResults(e.target.value);
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>
      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        {scriptLoaded && <PlacesAutocomplete
          value={address}
          onChange={handleChange}
          onSelect={handleSelect}
        >
          {({getInputProps, suggestions, getSuggestionItemProps, loading}) => (
            <Box style={{ width: "100%" }}>
              <Label style={{ margin: "15px 0 15px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Search for location by cities, countries, streets, etc</Label>
              <Box>
                <Input
                  style={{width: "100%", padding: "10px"}}
                  {...getInputProps({
                    placeholder: 'Search Places ...',
                    className: 'location-search-input',
                  })}
                />
                <Box className="autocomplete-dropdown-container">
                  {loading && <Box>Loading...</Box>}
                  {suggestions.map((suggestion, index) => {
                    const className = suggestion.active
                      ? 'suggestion-item--active'
                      : 'suggestion-item';
                    // inline style for demonstration purpose
                    const style = suggestion.active
                      ? {backgroundColor: '#fafafa', cursor: 'pointer', padding: "5px" }
                      : {backgroundColor: '#ffffff', cursor: 'pointer', padding: "5px" };
                    return (
                      <Box
                        key={index}
                        {...getSuggestionItemProps(suggestion, {
                          className,
                          style,
                        })}
                      >
                        <span>{suggestion.description}</span>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          )}
        </PlacesAutocomplete>}
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Sorting algorithm to use</Label>
        <select style={{width: "100%", padding: "5px"}} name="rankby" value={rankby} onChange={handleRankby}>
          <option style={{ padding: "5px" }} value="distance">Distance</option>
          <option style={{ padding: "5px" }} value="prominence">Prominence</option>
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} htmlFor="maxprice">Number of queries to run </Label>
        <Label style={{ textAlign: "center", width: "100%", marginBottom: "15px", fontWeight: "ligher", fontSize: "16px" }} >A new query will only run if the previous found 20. So at most it will find 60 for 3 runs.</Label>
        <select style={{width: "100%", padding: "5px"}} name="maxprice" value={nrOfResults} onChange={handleNrOfResults}>
          <option style={{ padding: "5px" }} value="1">1</option>
          <option style={{ padding: "5px" }} value="2">2</option>
          <option style={{ padding: "5px" }} value="3">3</option>
        </select>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} >Keyword</Label>
        <Label style={{ textAlign: "center", width: "100%", marginBottom: "15px", fontWeight: "ligher", fontSize: "16px" }} >A term to be matched against all content that Google has indexed for this place, including but not limited to name, type, and address, as well as customer reviews and other third-party content.</Label>
        <Input style={{width: "100%", padding: "5px"}} value={keyword} onChange={handleKeyword}/>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} >Country</Label>
        <Label style={{ textAlign: "center", width: "100%", marginBottom: "15px", fontWeight: "ligher", fontSize: "16px" }} >(Only used for filtering purposes on the admin panel)</Label>
        <Input style={{width: "100%", padding: "5px"}} value={country} onChange={handleCountry}/>
      </Box>

      {!radiusHidden && <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }} > Radius in meters</Label>
        <Input style={{width: "100%", padding: "5px"}} type="number" max="50000" value={radius} onChange={handleMeters}/>
      </Box>}


      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button variant={'success'} onClick={submit}>Create New Google Places</Button>
      </Box>

    </Box>
  );
};

export default NewGooglePlaces;
