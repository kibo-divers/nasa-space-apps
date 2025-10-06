const { useState, useRef, useEffect } = React;

const OrbitSimulator = () => {
  const [asteroidSize, setAsteroidSize] = useState(100);
  const [speed, setSpeed] = useState(20);
  const [inclination, setInclination] = useState(45);
  const [year, setYear] = useState(1950);
  const [impactLat, setImpactLat] = useState('--');
  const [impactLon, setImpactLon] = useState('--');
  const [energy, setEnergy] = useState('--');
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

  // Calculate mass from asteroid size
  const calculateMass = (size) => {
    const density = 3000;
    const radius = size / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = density * volume;
    
    console.log('Mass calculation:', { size, radius, volume, mass });
    return mass;
  };

  // Calculate impact energy
  const calculateEnergy = (size, velocity) => {
    const mass = calculateMass(size);
    const energyJoules = 0.5 * mass * Math.pow(velocity * 1000, 2);
    const energyTNT = energyJoules / (4.184 * 1e9);
    return energyTNT.toFixed(2) + ' MT';
  };

  // Call backend API with proper data types
  const callBackendAPI = async (velocity, mass, meteorType = 'generic', impactYear = 1950) => {
    setLoading(true);
    setError(null);
    setBackendData(null); // Clear previous data
    
    try {
      // Ensure proper data types - JavaScript doesn't have float(), int(), str() functions
      const requestData = {
        velocity: parseFloat(velocity) || 0,
        mass: parseFloat(mass) || 0,
        type_meteor: String(meteorType || 'H5'),
        year: parseInt(impactYear) || 1950
      };

      console.log('Sending to backend:', requestData);

      const response = await fetch('https://fuck-3-qvoh.onrender.com/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error details:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Backend Success:', data);
      setBackendData(data);
      return data;
      
    } catch (error) {
      console.error('Backend Error:', error);
      setError(`Server error: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Format backend data for better display
  const formatBackendData = (data) => {
    if (!data) return null;

    // Extract coordinates properly - handle different backend response formats
    let displayLat = '--';
    let displayLon = '--';
    
    if (data.impact_coordinates) {
      // Handle nested coordinate object
      displayLat = data.impact_coordinates.lat !== undefined ? data.impact_coordinates.lat : '--';
      displayLon = data.impact_coordinates.lon !== undefined ? data.impact_coordinates.lon : '--';
    } else if (data.lat !== undefined && data.lon !== undefined) {
      // Handle flat coordinate structure
      displayLat = data.lat;
      displayLon = data.lon;
    }

    return (
      <div style={{ 
        marginTop: '15px',
        padding: '12px',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        fontSize: '0.85rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid #333'
        }}>
          <strong style={{ 
            color: '#4fc3f7',
            fontSize: '0.9rem'
          }}>
            HISTORICAL ANALYSIS
          </strong>
          <span style={{ 
            color: '#81c784',
            fontSize: '0.75rem',
            background: '#1b5e20',
            padding: '2px 6px',
            borderRadius: '3px'
          }}>
            {year}
          </span>
        </div>

        {/* IMPACT COORDINATES - PROMINENTLY DISPLAYED */}
        <div style={{ 
          marginBottom: '12px',
          padding: '8px',
          background: '#2a1a1a',
          border: '1px solid #ff4444',
          borderRadius: '4px'
        }}>
          <div style={{ 
            color: '#ff9800', 
            marginBottom: '6px',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}>
            🎯 BACKEND IMPACT COORDINATES:
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '0.95rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ccc', fontSize: '0.7rem' }}>LATITUDE</div>
              <div style={{ 
                color: '#ff5252', 
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {typeof displayLat === 'number' ? displayLat.toFixed(4) + '°' : displayLat}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ccc', fontSize: '0.7rem' }}>LONGITUDE</div>
              <div style={{ 
                color: '#ff5252', 
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {typeof displayLon === 'number' ? displayLon.toFixed(4) + '°' : displayLon}
              </div>
            </div>
          </div>
          {data.impact_coordinates && (
            <div style={{ 
              color: '#888', 
              fontSize: '0.6rem', 
              textAlign: 'center',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              From backend API
            </div>
          )}
        </div>

        {/* Impact Probability */}
        {data.impact_probability !== undefined && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#4fc3f7', marginBottom: '4px' }}>
              <strong>IMPACT PROBABILITY:</strong>
            </div>
            <div style={{ 
              background: 'linear-gradient(90deg, #f44336, #4caf50)',
              height: '8px',
              borderRadius: '4px',
              marginBottom: '4px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  height: '100%',
                  width: `${(data.impact_probability * 100).toFixed(1)}%`,
                  background: '#4caf50',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <span style={{ color: '#e0e0e0', fontSize: '0.75rem' }}>
              {(data.impact_probability * 100).toFixed(1)}% chance of impact
            </span>
          </div>
        )}

        {/* Crater Size */}
        {data.crater_size && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#ba68c8', marginBottom: '4px' }}>
              <strong>ESTIMATED CRATER:</strong>
            </div>
            <span style={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
              {typeof data.crater_size === 'number' 
                ? `${data.crater_size.toFixed(1)} km diameter`
                : String(data.crater_size)
              }
            </span>
          </div>
        )}

        {/* Historical Context */}
        {data.historical_context && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#ffb74d', marginBottom: '4px' }}>
              <strong>HISTORICAL CONTEXT:</strong>
            </div>
            <div style={{ 
              color: '#e0e0e0', 
              fontSize: '0.75rem',
              fontStyle: 'italic',
              lineHeight: '1.3'
            }}>
              {data.historical_context}
            </div>
          </div>
        )}

        {/* Population Impact */}
        {data.population_impact && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#ef5350', marginBottom: '4px' }}>
              <strong>POPULATION IMPACT:</strong>
            </div>
            <span style={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
              {data.population_impact}
            </span>
          </div>
        )}

        {/* Raw Data for debugging */}
        <details style={{ marginTop: '10px', borderTop: '1px solid #333', paddingTop: '8px' }}>
          <summary style={{ 
            color: '#888', 
            fontSize: '0.7rem', 
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            Raw Backend Data
          </summary>
          <pre style={{ 
            color: '#888', 
            fontSize: '0.6rem',
            marginTop: '5px',
            overflow: 'auto',
            maxHeight: '100px',
            background: '#222',
            padding: '8px',
            borderRadius: '4px'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // ... (rest of your existing code for Earth material, asteroid material, orbit controls, etc.)

  // Run orbit simulation with year parameter
  const runOrbit = async () => {
    // Clear previous results immediately
    setImpactLat('--');
    setImpactLon('--');
    setEnergy('--');
    setBackendData(null);
    setError(null);
    
    // Set temporary random coordinates (will be overridden by backend if available)
    const lat = (Math.random() * 180 - 90).toFixed(2);
    const lon = (Math.random() * 360 - 180).toFixed(2);
    
    setImpactLat(lat);
    setImpactLon(lon);
    
    const mass = calculateMass(asteroidSize);
    const energyValue = calculateEnergy(asteroidSize, speed);
    setEnergy(energyValue);
    
    // Call backend API with year parameter
    const backendResult = await callBackendAPI(speed, mass, 'generic', year);
    
    // Update coordinates with backend data if available
    if (backendResult) {
      if (backendResult.impact_coordinates) {
        // Use backend coordinates
        setImpactLat(backendResult.impact_coordinates.lat);
        setImpactLon(backendResult.impact_coordinates.lon);
      } else if (backendResult.lat !== undefined && backendResult.lon !== undefined) {
        // Handle flat coordinate structure
        setImpactLat(backendResult.lat);
        setImpactLon(backendResult.lon);
      }
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animateAsteroid();
  };

  // ... (rest of your existing code for getHistoricalContext, initScene, animateAsteroid, etc.)

  return (
    <div style={{ 
      width: '800px',
      maxWidth: '90%',
      margin: '20px auto',
      padding: '20px',
      background: '#000000',
      border: '2px solid #ffffff',
      borderRadius: '0px',
      fontFamily: '"Nova Square", monospace, sans-serif',
      fontWeight: 'normal',
      color: '#ffffff'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ 
          color: '#ffffff',
          fontSize: '1.8rem',
          fontWeight: 'normal',
          margin: '0',
          fontFamily: '"Nova Square", monospace, sans-serif',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          HISTORICAL ASTEROID IMPACT SIMULATOR
        </h2>
        <div style={{ 
          color: '#cccccc',
          fontSize: '1rem',
          marginTop: '5px',
          fontFamily: '"Nova Square", monospace, sans-serif'
        }}>
          SIMULATE IMPACTS FROM 1600-2000
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '25px',
        alignItems: 'start'
      }}>
        {/* Controls Panel */}
        <div style={{ 
          fontSize: '1rem',
          fontFamily: '"Nova Square", monospace, sans-serif'
        }}>
          {/* ... (your existing controls code) */}
          
          <button
            onClick={runOrbit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#333333' : '#000000',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: '0px',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'normal',
              fontFamily: '"Nova Square", monospace, sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '20px',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = '#ffffff';
                e.target.style.color = '#000000';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = '#000000';
                e.target.style.color = '#ffffff';
              }
            }}
          >
            {loading ? 'CALCULATING...' : `SIMULATE ${year}`}
          </button>
          
          {/* Results Display */}
          <div style={{ 
            color: '#ffffff',
            fontSize: '1rem',
            border: '1px solid #ffffff',
            padding: '15px',
            background: '#111111',
            fontFamily: '"Nova Square", monospace, sans-serif',
            minHeight: '200px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{fontFamily: '"Nova Square", monospace, sans-serif'}}>
                IMPACT YEAR: {year}
              </strong>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{fontFamily: '"Nova Square", monospace, sans-serif'}}>
                CURRENT LOCATION:
              </strong><br />
              <span style={{color: '#ff2222'}}>
                {impactLat}° / {impactLon}°
              </span>
              <div style={{ 
                color: '#888', 
                fontSize: '0.7rem',
                fontStyle: 'italic',
                marginTop: '2px'
              }}>
                {backendData ? 'From backend calculation' : 'Random simulation'}
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{fontFamily: '"Nova Square", monospace, sans-serif'}}>
                ENERGY:
              </strong><br />
              <span style={{color: '#ff2222'}}>
                {energy} TNT
              </span>
            </div>
            
            {/* Enhanced Backend Data Display */}
            {formatBackendData(backendData)}
            
            {error && (
              <div style={{ 
                marginTop: '10px',
                padding: '8px',
                background: '#330000',
                border: '1px solid #ff2222',
                fontSize: '0.8rem',
                color: '#ff6666'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* 3D Canvas */}
        <div style={{ fontFamily: '"Nova Square", monospace, sans-serif' }}>
          <div 
            ref={canvasRef}
            style={{
              width: '100%',
              height: '350px',
              background: '#000011',
              border: '2px solid #ffffff',
              borderRadius: '0px',
              cursor: 'grab'
            }}
          />
          <div style={{ 
            textAlign: 'center', 
            marginTop: '10px', 
            color: '#cccccc',
            fontSize: '0.9rem',
            fontFamily: '"Nova Square", monospace, sans-serif'
          }}>
            DRAG TO ROTATE • SCROLL TO ZOOM • YEAR: {year}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        borderTop: '1px solid #333333',
        fontSize: '0.8rem',
        color: '#666666',
        textAlign: 'center',
        fontFamily: '"Nova Square", monospace, sans-serif'
      }}>
        HISTORICAL IMPACT SIMULATION • YEARS 1600-2000
      </div>
    </div>
  );
};

// ... (rest of your rendering code)
