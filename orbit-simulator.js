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

  // Calculate impact energy
  const calculateEnergy = (size, velocity) => {
    const density = 3000;
    const radius = size / 2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3);
    const mass = density * volume;
    const energyJoules = 0.5 * mass * Math.pow(velocity * 1000, 2);
    const energyTNT = energyJoules / (4.184 * 1e9);
    
    return energyTNT.toFixed(2) + ' MT';
  };

  // Simple orbit controls
  const setupOrbitControls = (camera, canvas) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const onMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };
    
    const onMouseMove = (event) => {
      if (!isDragging) return;
      
      const deltaX = event.clientX - previousMousePosition.x;
      const deltaY = event.clientY - previousMousePosition.y;
      
      // Rotate camera around the scene
      camera.rotation.y += deltaX * 0.01;
      camera.rotation.x += deltaY * 0.01;
      
      // Limit vertical rotation
      camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
      
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };
    
    const onMouseUp = () => {
      isDragging = false;
    };
    
    const onWheel = (event) => {
      // Zoom in/out
      camera.position.z += event.deltaY * 0.01;
      // Limit zoom
      camera.position.z = Math.max(3, Math.min(15, camera.position.z));
    };
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel);
    
    // Return cleanup function
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  };

  // Initialize Three.js scene
  const initScene = () => {
    if (!canvasRef.current) {
      console.log('Canvas ref not ready');
      return;
    }

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        alpha: true
      });
      
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0);
      canvasRef.current.innerHTML = '';
      canvasRef.current.appendChild(renderer.domElement);

      // Create Earth with wireframe
      const earthGeometry = new THREE.SphereGeometry(1.5, 12, 10);
      const earthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        wireframe: true
      });
      const earth = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(earth);

      // Create orbit path
      const orbitPoints = [];
      const orbitRadius = 3;
      for (let i = 0; i <= 48; i++) {
        const angle = (i / 48) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        ));
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbit);

      // Create asteroid
      const asteroidGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const asteroidMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff2222,
        wireframe: true
      });
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      scene.add(asteroid);

      // Position camera
      camera.position.z = 6;

      // Set up orbit controls
      const cleanupControls = setupOrbitControls(camera, renderer.domElement);

      sceneRef.current = { 
        scene, 
        camera, 
        renderer, 
        earth, 
        orbit, 
        asteroid,
        cleanupControls 
      };
      
      animateAsteroid();
      console.log('Scene initialized successfully with controls');
    } catch (error) {
      console.error('Error initializing scene:', error);
    }
  };

  // Animate asteroid
  const animateAsteroid = () => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, asteroid, orbit } = sceneRef.current;
    
    // Update orbit inclination
    orbit.rotation.z = inclination * Math.PI / 180;
    
    const time = Date.now() * 0.001 * (speed / 10);
    const radius = 3;
    const x = Math.cos(time) * radius;
    const y = Math.sin(time) * Math.sin(inclination * Math.PI / 180) * radius;
    const z = Math.sin(time) * Math.cos(inclination * Math.PI / 180) * radius;
    
    asteroid.position.set(x, y, z);
    
    const scale = asteroidSize / 200;
    asteroid.scale.set(scale, scale, scale);

    asteroid.rotation.x = Math.sin(Date.now() * 0.002) * 0.1;
    asteroid.rotation.y = Math.cos(Date.now() * 0.002) * 0.1;

    renderer.render(scene, camera);
    animationRef.current = requestAnimationFrame(animateAsteroid);
  };

  // Run orbit simulation
  const runOrbit = () => {
    const lat = (Math.random() * 180 - 90).toFixed(2);
    const lon = (Math.random() * 360 - 180).toFixed(2);
    
    setImpactLat(lat);
    setImpactLon(lon);
    setEnergy(calculateEnergy(asteroidSize, speed));
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animateAsteroid();
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
      if (sceneRef.current && sceneRef.current.cleanupControls) {
        sceneRef.current.cleanupControls();
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
          ASTEROID IMPACT SIMULATOR
        </h2>
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
          
          <div style={{ marginBottom: '20px' }}>
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
          
          <button
            onClick={runOrbit}
            style={{
              width: '100%',
              padding: '12px',
              background: '#000000',
              color: '#ffffff',
              border: '2px solid #ffffff',
              borderRadius: '0px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              fontWeight: 'normal',
              fontFamily: '"Nova Square", monospace, sans-serif',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.color = '#000000';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#000000';
              e.target.style.color = '#ffffff';
            }}
          >
            RUN SIMULATION
          </button>
          
          {/* Results Display */}
          <div style={{ 
            color: '#ffffff',
            fontSize: '1rem',
            border: '1px solid #ffffff',
            padding: '15px',
            background: '#111111',
            fontFamily: '"Nova Square", monospace, sans-serif'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <strong style={{fontFamily: '"Nova Square", monospace, sans-serif'}}>
                IMPACT:
              </strong><br />
              <span style={{color: '#ff2222'}}>
                {impactLat}° / {impactLon}°
              </span>
            </div>
            <div>
              <strong style={{fontFamily: '"Nova Square", monospace, sans-serif'}}>
                ENERGY:
              </strong><br />
              <span style={{color: '#ff2222'}}>
                {energy} TNT
              </span>
            </div>
          </div>
        </div>
        
        {/* 3D Canvas */}
        <div style={{ fontFamily: '"Nova Square", monospace, sans-serif' }}>
          <div 
            ref={canvasRef}
            style={{
              width: '100%',
              height: '300px',
              background: '#000000',
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
            DRAG TO ROTATE • SCROLL TO ZOOM
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
        INTERACTIVE 3D ORBITAL SIMULATION
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
      console.log('Orbit simulator rendered successfully');
    } catch (error) {
      console.error('Error rendering orbit simulator:', error);
      setTimeout(renderOrbitSimulator, 500);
    }
  } else {
    setTimeout(renderOrbitSimulator, 100);
  }
}

// Start the rendering process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderOrbitSimulator);
} else {
  renderOrbitSimulator();
}

setTimeout(renderOrbitSimulator, 1000);