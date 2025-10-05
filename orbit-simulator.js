const { useState, useRef, useEffect } = React;

const OrbitSimulator = () => {
  const [asteroidSize, setAsteroidSize] = useState(100);
  const [speed, setSpeed] = useState(20);
  const [inclination, setInclination] = useState(45);
  const [impactLat, setImpactLat] = useState('--');
  const [impactLon, setImpactLon] = useState('--');
  const [energy, setEnergy] = useState('--');
  
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

  // Calculate impact energy (simplified formula)
  const calculateEnergy = (size, velocity) => {
    const density = 3000;
    const radius = size / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = density * volume;
    const energyJoules = 0.5 * mass * Math.pow(velocity * 1000, 2);
    const energyTNT = energyJoules / (4.184 * 1e9);
    
    return energyTNT.toFixed(2) + ' MT';
  };

  // Initialize Three.js scene
  const initScene = () => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    // Smaller canvas size
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    canvasRef.current.innerHTML = '';
    canvasRef.current.appendChild(renderer.domElement);

    // Create Earth (smaller)
    const earthGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const earthTexture = new THREE.MeshBasicMaterial({ 
      color: 0x2233ff,
      transparent: true,
      opacity: 0.8
    });
    const earth = new THREE.Mesh(earthGeometry, earthTexture);
    scene.add(earth);

    // Create orbit path (smaller)
    const orbitGeometry = new THREE.TorusGeometry(3, 0.02, 16, 100);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    scene.add(orbit);

    // Create asteroid (smaller)
    const asteroidGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xff4422 });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    scene.add(asteroid);

    // Position camera closer
    camera.position.z = 6;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    sceneRef.current = { scene, camera, renderer, earth, orbit, asteroid };
    
    // Start animation
    animateAsteroid();
  };

  // Animate asteroid along orbit
  const animateAsteroid = () => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, asteroid, orbit } = sceneRef.current;
    
    // Update orbit inclination
    orbit.rotation.z = inclination * Math.PI / 180;
    
    // Calculate asteroid position
    const time = Date.now() * 0.001 * (speed / 10);
    const radius = 3; // Smaller radius
    const x = Math.cos(time) * radius;
    const y = Math.sin(time) * Math.sin(inclination * Math.PI / 180) * radius;
    const z = Math.sin(time) * Math.cos(inclination * Math.PI / 180) * radius;
    
    asteroid.position.set(x, y, z);
    
    // Update asteroid size
    const scale = asteroidSize / 200; // Smaller scaling
    asteroid.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
    animationRef.current = requestAnimationFrame(animateAsteroid);
  };

  // Run orbit simulation
  const runOrbit = () => {
    // Calculate random impact coordinates
    const lat = (Math.random() * 180 - 90).toFixed(2);
    const lon = (Math.random() * 360 - 180).toFixed(2);
    
    setImpactLat(lat);
    setImpactLon(lon);
    setEnergy(calculateEnergy(asteroidSize, speed));
    
    // Reset and restart animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animateAsteroid();
  };

  // Initialize on component mount
  useEffect(() => {
    initScene();
    
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
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ 
      maxWidth: '700px', 
      margin: '0 auto', 
      padding: '15px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '20px', 
        color: '#fff',
        fontSize: '1.5rem'
      }}>
        Asteroid Impact – 3D View
      </h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Controls Panel */}
        <div style={{ fontSize: '0.9rem' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#fff' }}>
              Asteroid size (m): {asteroidSize}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              value={asteroidSize}
              onChange={(e) => setAsteroidSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#fff' }}>
              Speed (km/s): {speed}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: '#fff' }}>
              Inclination (°): {inclination}
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={inclination}
              onChange={(e) => setInclination(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <button
            onClick={runOrbit}
            style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Run Orbit
          </button>
          
          {/* Impact Results */}
          <div style={{ 
            marginTop: '20px', 
            color: '#fff',
            fontSize: '0.85rem'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Impact Lat/Lon:</strong> {impactLat}° / {impactLon}°
            </div>
            <div>
              <strong>Energy (TNT):</strong> {energy}
            </div>
          </div>
        </div>
        
        {/* 3D Canvas - Smaller */}
        <div>
          <div 
            ref={canvasRef}
            style={{
              width: '100%',
              height: '250px', // Much smaller height
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          />
          <div style={{ 
            textAlign: 'center', 
            marginTop: '8px', 
            color: '#ccc',
            fontSize: '12px'
          }}>
            Drag to rotate • Scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
};

// Render the React component
ReactDOM.render(<OrbitSimulator />, document.getElementById('orbit-simulator-root'));