import React,{ useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PlacesAutocomplete from 'react-places-autocomplete';
import { env } from 'admin-bro'
import {
  geocodeByAddress,
  geocodeByPlaceId,
  getLatLng,
} from 'react-places-autocomplete';
import { Input, Box, Label, Button } from '@admin-bro/design-system'

const NewGooglePlace = () => {
  const [name, setName] = useState();
  const [country, setCountry] = useState();
  const [city, setCity] = useState();
  const [vicinity, setVicinity] = useState();
  const [fullAddress, setFullAddress] = useState();
  const [file, setFile] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [address, setAddress] = useState('');
  const [latlong, setLatlong] = useState();
  const handleSelect = address => {
    geocodeByAddress(address)
      .then(results => {
        let addr = ""
        results[0].address_components.forEach(e => {
          addr += ` ${e.long_name},   `
        })
        setFullAddress(addr)
        setAddress(results[0].formatted_address)
        setVicinity(results[0].formatted_address)
        setCity(results[0].address_components[results[0].address_components.length -3].long_name)
        setCountry(results[0].address_components[results[0].address_components.length -2].long_name)
        console.log(results)
        setLatlong({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        })
      })
      .catch(error => console.error('Error', error));
  };
  const el = useRef();

  useEffect(() => {
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

  const handleChange = (e) => {
    const file = e.target.files[0]; // accesing file
    console.log(file);
    setFile(file); // storing file
  }

  const handleChangeAuto = address => {
    setAddress(address);
  };

  const submit = async () => {
      try {
        if (name && latlong&& country && city && file) {
          const { lat, lng } = latlong;
          const formData = new FormData();
          formData.append('img', file);
          formData.append('name', name);
          formData.append('lat', lat);
          formData.append('long', lng);
          formData.append('country', country);
          formData.append('city', city);
          formData.append('vicinity', vicinity);
          await axios.post(env.API_URL + '/admin/create-google-place', formData);
          alert('Google Place created');
          window.location.href = env.BASE_URL + "/resources/GooglePlaces";
        } else {
          alert('Please fill in all the fields.');
        }
      } catch(e) {
        console.log(e);
      }
  }

  return (
    <Box style={{ padding: "30px" }} className={'wrapper'}>

      <Box style={{ marginTop: 20, marginBottom: 20 }}>
        <input type="file" ref={el} onChange={handleChange} />
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>Name of Venue</Label>
        <Input style={{width: "100%", padding: "5px"}} value={name} onChange={(e) => setName(e.target.value)}/>
      </Box>

      {scriptLoaded && <PlacesAutocomplete
        value={address}
        onChange={handleChangeAuto}
        onSelect={handleSelect}
      >
        {({getInputProps, suggestions, getSuggestionItemProps, loading}) => (
          <Box style={{ width: "100%" }}>
            <Label style={{ margin: "20px", fontWeight: "bolder", fontSize: "20px" }} htmlFor="rankby">Search for location by cities, countries, streets, etc</Label>
            <Box>
              <Input
                style={{width: "100%", padding: "10px", margin: "20px"}}
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

      { fullAddress && <Box style={{marginTop: 20, marginBottom: 20}}>
        <Label style={{ fontSize: 'bold' }}>The full address we get from google:</Label>
        <Label>{fullAddress}</Label>
      </Box>}

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>vicinity</Label>
        <Input style={{width: "100%", padding: "5px"}} value={vicinity} onChange={(e) => setVicinity(e.target.value)}/>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>City</Label>
        <Input style={{width: "100%", padding: "5px"}} value={city} onChange={(e) => setCity(e.target.value)}/>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Label style={{ textAlign: "center", width: "100%", margin: "15px 0 10px 0", fontWeight: "bolder", fontSize: "20px" }}>Country</Label>
        <Input style={{width: "100%", padding: "5px"}} value={country} onChange={(e) => setCountry(e.target.value)}/>
      </Box>

      <Box style={{ display: "flex", alignItems: "center", justifyContent: "center", flexFlow: "row wrap", margin: "20px" }}>
        <Button variant={'success'} onClick={submit}>Create new Google Place</Button>
      </Box>

    </Box>
  );
};

export default NewGooglePlace;
