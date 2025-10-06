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

        {/* Impact Coordinates */}
        {data.impact_coordinates && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ color: '#ff9800', marginBottom: '4px' }}>
              <strong>IMPACT COORDINATES:</strong>
            </div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
              <span>Lat: <span style={{ color: '#ff5252' }}>{data.impact_coordinates.lat}°</span></span>
              <span>Lon: <span style={{ color: '#ff5252' }}>{data.impact_coordinates.lon}°</span></span>
            </div>
          </div>
        )}

        {/* Impact Probability */}
        {data.impact_probability !== undefined && (
          <div style={{ marginBottom: '8px' }}>
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
          <div style={{ marginBottom: '8px' }}>
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
          <div style={{ marginBottom: '8px' }}>
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
          <div style={{ marginBottom: '8px' }}>
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
            Raw Data
          </summary>
          <pre style={{ 
            color: '#888', 
            fontSize: '0.6rem',
            marginTop: '5px',
            overflow: 'auto',
            maxHeight: '100px'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // Create realistic Earth material
  const createEarthMaterial = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a5276');
    gradient.addColorStop(0.3, '#2980b9');
    gradient.addColorStop(0.5, '#27ae60');
    gradient.addColorStop(0.7, '#229954');
    gradient.addColorStop(1, '#1d8348');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 10 + Math.random() * 30;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshPhongMaterial({
      map: texture,
      specular: new THREE.Color(0x333333),
      shininess: 10
    });
  };

  // Create asteroid material with surface detail
  const createAsteroidMaterial = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = '#654321';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 2 + Math.random() * 8;
      context.beginPath();
      context.arc(x, y, size, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.05,
      specular: new THREE.Color(0x222222),
      shininess: 5
    });
  };

  // Enhanced orbit controls with smooth damping
  const setupOrbitControls = (camera, canvas) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotation = { x: 0, y: 0 };
    let currentRotation = { x: 0, y: 0 };
    
    const onMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      canvas.style.cursor = 'grabbing';
    };
    
    const onMouseMove = (event) => {
      if (!isDragging) return;
      
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      
      targetRotation.y += deltaX * 0.01;
      targetRotation.x += deltaY * 0.01;
      targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotation.x));
      
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };
    
    const onMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };
    
    const onWheel = (event) => {
      camera.position.z += event.deltaY * 0.01;
      camera.position.z = Math.max(3, Math.min(20, camera.position.z));
    };
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
    
    const updateRotation = () => {
      const damping = 0.1;
      currentRotation.x += (targetRotation.x - currentRotation.x) * damping;
      currentRotation.y += (targetRotation.y - currentRotation.y) * damping;
      
      camera.rotation.x = currentRotation.x;
      camera.rotation.y = currentRotation.y;
    };
    
    return { updateRotation, cleanup: () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    }};
  };

  // Initialize enhanced Three.js scene
  const initScene = () => {
    if (!canvasRef.current) return;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000011);
      
      const camera = new THREE.PerspectiveCamera(60, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false
      });
      
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setClearColor(0x000011, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      canvasRef.current.innerHTML = '';
      canvasRef.current.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0x333333, 0.4);
      scene.add(ambientLight);
      
      const mainLight = new THREE.DirectionalLight(0xffffff, 1);
      mainLight.position.set(10, 10, 10);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      scene.add(mainLight);
      
      const fillLight = new THREE.DirectionalLight(0x4466ff, 0.3);
      fillLight.position.set(-5, -5, -5);
      scene.add(fillLight);

      const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
      const earth = new THREE.Mesh(earthGeometry, createEarthMaterial());
      earth.castShadow = true;
      earth.receiveShadow = true;
      scene.add(earth);

      const orbitGroup = new THREE.Group();
      
      const orbitPoints = [];
      const orbitRadius = 4;
      for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        ));
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4488ff,
        transparent: true,
        opacity: 0.6
      });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitGroup.add(orbit);
      
      const dashedOrbitMaterial = new THREE.LineDashedMaterial({
        color: 0x888888,
        dashSize: 0.2,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.3
      });
      const dashedOrbit = new THREE.Line(orbitGeometry, dashedOrbitMaterial);
      dashedOrbit.computeLineDistances();
      orbitGroup.add(dashedOrbit);
      
      scene.add(orbitGroup);

      const asteroidGeometry = new THREE.SphereGeometry(0.2, 32, 32);
      const positions = asteroidGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const variation = 0.1;
        positions[i] += (Math.random() - 0.5) * variation;
        positions[i + 1] += (Math.random() - 0.5) * variation;
        positions[i + 2] += (Math.random() - 0.5) * variation;
      }
      asteroidGeometry.attributes.position.needsUpdate = true;
      asteroidGeometry.computeVertexNormals();
      
      const asteroid = new THREE.Mesh(asteroidGeometry, createAsteroidMaterial());
      asteroid.castShadow = true;
      asteroid.receiveShadow = true;
      
      const asteroidGlowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const asteroidGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.2
      });
      const asteroidGlow = new THREE.Mesh(asteroidGlowGeometry, asteroidGlowMaterial);
      asteroid.add(asteroidGlow);
      
      scene.add(asteroid);

      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
      });
      
      const starsVertices = [];
      for (let i = 0; i < 1000; i++) {
        const radius = 20 + Math.random() * 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        starsVertices.push(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
      }
      
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);

      camera.position.z = 8;

      const controls = setupOrbitControls(camera, renderer.domElement);

      sceneRef.current = { 
        scene, 
        camera, 
        renderer, 
        earth, 
        orbit: orbitGroup, 
        asteroid,
        stars,
        controls,
        orbitRadius
      };
      
      animateAsteroid();
    } catch (error) {
      console.error('Error initializing scene:', error);
    }
  };

  // Enhanced animation with trail effect
  const animateAsteroid = () => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, earth, asteroid, controls, orbitRadius } = sceneRef.current;
    
    if (controls && controls.updateRotation) {
      controls.updateRotation();
    }
    
    earth.rotation.y += 0.002;
    
    sceneRef.current.orbit.rotation.z = inclination * Math.PI / 180;
    
    const time = Date.now() * 0.001 * (speed / 10);
    const x = Math.cos(time) * orbitRadius;
    const y = Math.sin(time) * Math.sin(inclination * Math.PI / 180) * orbitRadius;
    const z = Math.sin(time) * Math.cos(inclination * Math.PI / 180) * orbitRadius;
    
    asteroid.position.set(x, y, z);
    
    const scale = 0.5 + (asteroidSize / 400);
    asteroid.scale.set(scale, scale, scale);

    asteroid.rotation.x += 0.02;
    asteroid.rotation.y += 0.015;
    asteroid.rotation.z += 0.01;

    const glow = asteroid.children[0];
    if (glow) {
      glow.scale.x = 1 + Math.sin(Date.now() * 0.005) * 0.2;
      glow.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.2;
      glow.scale.z = 1 + Math.sin(Date.now() * 0.005) * 0.2;
    }

    renderer.render(scene, camera);
    animationRef.current = requestAnimationFrame(animateAsteroid);
  };

  // Run orbit simulation with year parameter
  const runOrbit = async () => {
    // Clear previous results immediately
    setImpactLat('--');
    setImpactLon('--');
    setEnergy('--');
    setBackendData(null);
    setError(null);
    
    const lat = (Math.random() * 180 - 90).toFixed(2);
    const lon = (Math.random() * 360 - 180).toFixed(2);
    
    setImpactLat(lat);
    setImpactLon(lon);
    
    const mass = calculateMass(asteroidSize);
    const energyValue = calculateEnergy(asteroidSize, speed);
    setEnergy(energyValue);
    
    // Call backend API with year parameter
    const backendResult = await callBackendAPI(speed, mass, 'generic', year);
    
    if (backendResult && backendResult.impact_coordinates) {
      setImpactLat(backendResult.impact_coordinates.lat);
      setImpactLon(backendResult.impact_coordinates.lon);
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animateAsteroid();
  };

  // Get historical context for the selected year
  const getHistoricalContext = (year) => {
    if (year < 1900) return "Pre-modern era";
    if (year < 1950) return "Early modern era";
    return "Modern era";
  };

  // Initialize scene when component mounts and canvas is ready
  useEffect(() => {
    const init = () => {
      if (canvasRef.current) {
        initScene();
      } else {
        setTimeout(init, 100);
      }
    };

    init();

    const handleResize = () => {
      if (sceneRef.current && canvasRef.current) {
        const { camera, renderer } = sceneRef.current;
        camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sceneRef.current && sceneRef.current.controls) {
        sceneRef.current.controls.cleanup();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#ffffff',
              fontFamily: '"Nova Square", monospace, sans-serif',
              fontSize: '1.1rem'
            }}>
              SIZE: {asteroidSize}M
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={asteroidSize}
              onChange={(e) => setAsteroidSize(parseInt(e.target.value))}
              style={{ 
                width: '100%',
                border: '1px solid #ffffff',
                background: '#333333',
                height: '6px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#ffffff',
              fontFamily: '"Nova Square", monospace, sans-serif',
              fontSize: '1.1rem'
            }}>
              SPEED: {speed}KM/S
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={{ 
                width: '100%',
                border: '1px solid #ffffff',
                background: '#333333',
                height: '6px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#ffffff',
              fontFamily: '"Nova Square", monospace, sans-serif',
              fontSize: '1.1rem'
            }}>
              INCLINATION: {inclination}°
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={inclination}
              onChange={(e) => setInclination(parseInt(e.target.value))}
              style={{ 
                width: '100%',
                border: '1px solid #ffffff',
                background: '#333333',
                height: '6px'
              }}
            />
          </div>
          
          {/* Year Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#ffffff',
              fontFamily: '"Nova Square", monospace, sans-serif',
              fontSize: '1.1rem'
            }}>
              YEAR: {year}
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#cccccc',
                marginLeft: '10px'
              }}>
                {getHistoricalContext(year)}
              </span>
            </label>
            <input
              type="range"
              min="1600"
              max="2000"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              style={{ 
                width: '100%',
                border: '1px solid #ffffff',
                background: '#333333',
                height: '6px'
              }}
            />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#888888',
              marginTop: '5px'
            }}>
              <span>1600</span>
              <span>1800</span>
              <span>2000</span>
            </div>
          </div>
          
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
                LOCATION:
              </strong><br />
              <span style={{color: '#ff2222'}}>
                {impactLat}° / {impactLon}°
              </span>
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

// Robust rendering with multiple fallbacks
function renderOrbitSimulator() {
  const rootElement = document.getElementById('orbit-simulator-root');
  
  if (rootElement && window.React && window.ReactDOM) {
    try {
      ReactDOM.render(React.createElement(OrbitSimulator), rootElement);
    } catch (error) {
      console.error('Error rendering orbit simulator:', error);
      setTimeout(renderOrbitSimulator, 500);
    }
  } else {
    setTimeout(renderOrbitSimulator, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderOrbitSimulator);
} else {
  renderOrbitSimulator();
}

setTimeout(renderOrbitSimulator, 1000);
