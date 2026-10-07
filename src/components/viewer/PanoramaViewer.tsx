import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Hotspot } from '../../types/database';
import { resolvePanoramaUrl, getBundledFallbackUrl } from '../../assets/panoramas';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Info,
  Check,
  Crosshair,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Gauge,
} from 'lucide-react';

interface PanoramaViewerProps {
  panoramaUrl: string;
  stageTitle?: string;
  stageDescription?: string;
  hotspots?: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
  // Admin placement mode
  placementMode?: boolean;
  onSphereClick?: (coords: { x: number; y: number; z: number }) => void;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
  // Progress indicators
  answeredQuestionsCount?: number;
  totalQuestionsCount?: number;
  isAnsweredCorrectly?: (hotspotId: string) => boolean;
  // Story-driven seamless transition
  isTransitioning?: boolean;
  transitionMessage?: string;
}

interface ProjectedHotspot {
  hotspot: Hotspot;
  screenX: number;
  screenY: number;
  isVisible: boolean;
  isCorrect: boolean;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = ({
  panoramaUrl,
  stageTitle,
  stageDescription,
  hotspots = [],
  onHotspotClick,
  placementMode = false,
  onSphereClick,
  initialYaw = 0,
  initialPitch = 0,
  initialFov = 75,
  answeredQuestionsCount = 0,
  totalQuestionsCount = 5,
  isAnsweredCorrectly,
  isTransitioning = false,
  transitionMessage = 'در حال انتقال به فضای بعدی...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Interaction State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState<1 | 2>(1);
  const [isLoadingTexture, setIsLoadingTexture] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [projectedHotspots, setProjectedHotspots] = useState<ProjectedHotspot[]>([]);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [lastPlacedPoint, setLastPlacedPoint] = useState<{ x: number; y: number; z: number } | null>(null);

  // Synced refs for animation frame loop (avoids stale closures)
  const autoRotateRef = useRef(false);
  const rotateSpeedRef = useRef<number>(1);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  useEffect(() => {
    rotateSpeedRef.current = rotateSpeed;
  }, [rotateSpeed]);

  // Rotation angles (degrees) and target angles
  const isUserInteracting = useRef(false);
  const lon = useRef(initialYaw);
  const lat = useRef(initialPitch);
  const targetLon = useRef(initialYaw);
  const targetLat = useRef(initialPitch);
  const fov = useRef(initialFov);

  // Touch and inertia velocity
  const velLon = useRef(0);
  const velLat = useRef(0);
  const lastPointerTime = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const pointerDownStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-touch tracking
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchFov = useRef<number>(initialFov);

  // Button hold-to-pan state
  const holdDirectionRef = useRef<'left' | 'right' | 'up' | 'down' | null>(null);

  // Reset or initial position updates
  useEffect(() => {
    lon.current = initialYaw;
    lat.current = initialPitch;
    targetLon.current = initialYaw;
    targetLat.current = initialPitch;
    velLon.current = 0;
    velLat.current = 0;
    fov.current = initialFov;
    if (cameraRef.current) {
      cameraRef.current.fov = initialFov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [initialYaw, initialPitch, initialFov, panoramaUrl]);

  // Spatial cinematic zoom effect during continuous space transitions
  useEffect(() => {
    if (isTransitioning) {
      if (cameraRef.current) {
        cameraRef.current.fov = Math.max(40, fov.current - 22);
        cameraRef.current.updateProjectionMatrix();
      }
    } else {
      if (cameraRef.current) {
        cameraRef.current.fov = initialFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  }, [isTransitioning, initialFov]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera: placed at (0, 0, 0)
    const camera = new THREE.PerspectiveCamera(fov.current, width / height, 1, 1100);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current || undefined,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // 4. Sphere geometry: radius 500, flipped inside
    const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
    sphereGeo.scale(-1, 1, 1);

    // Initial placeholder material
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x11161d,
      side: THREE.FrontSide,
    });

    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // Texture Loader
    textureLoaderRef.current = new THREE.TextureLoader();

    // 5. Render Loop with ultra-smooth damping & inertia
    lastRenderTime.current = performance.now();

    const render = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const cam = cameraRef.current;
      const now = performance.now();
      const delta = Math.min((now - lastRenderTime.current) / 1000, 0.1);
      lastRenderTime.current = now;

      // Auto-rotation when active and user not touching/dragging
      if (autoRotateRef.current && !isUserInteracting.current && activePointers.current.size === 0) {
        targetLon.current += 0.22 * rotateSpeedRef.current;
      }

      // Continuous button hold pan
      if (holdDirectionRef.current) {
        const panRate = 0.65;
        if (holdDirectionRef.current === 'left') targetLon.current -= panRate;
        if (holdDirectionRef.current === 'right') targetLon.current += panRate;
        if (holdDirectionRef.current === 'up') targetLat.current = Math.min(85, targetLat.current + panRate * 0.7);
        if (holdDirectionRef.current === 'down') targetLat.current = Math.max(-85, targetLat.current - panRate * 0.7);
      }

      // Smooth inertia momentum decay when user released finger/pointer
      if (!isUserInteracting.current && activePointers.current.size === 0) {
        if (Math.abs(velLon.current) > 0.005) {
          targetLon.current += velLon.current;
          velLon.current *= 0.935; // smooth deceleration
        } else {
          velLon.current = 0;
        }

        if (Math.abs(velLat.current) > 0.005) {
          targetLat.current += velLat.current;
          velLat.current *= 0.935;
        } else {
          velLat.current = 0;
        }
      }

      // Frame-rate independent exponential smoothing (damping)
      const smoothRate = Math.min(1, 1 - Math.exp(-22 * delta));
      lon.current += (targetLon.current - lon.current) * smoothRate;
      lat.current += (targetLat.current - lat.current) * smoothRate;

      // Clamp latitude to prevent gimbal flip
      lat.current = Math.max(-85, Math.min(85, lat.current));
      targetLat.current = Math.max(-85, Math.min(85, targetLat.current));

      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      const targetX = 500 * Math.sin(phi) * Math.cos(theta);
      const targetY = 500 * Math.cos(phi);
      const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

      cam.lookAt(targetX, targetY, targetZ);
      rendererRef.current.render(sceneRef.current, cam);

      // Project hotspots onto 2D viewport
      updateHotspotProjections();

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, []);

  // Update Hotspot 2D Projections
  const updateHotspotProjections = useCallback(() => {
    if (!cameraRef.current || !containerRef.current || hotspots.length === 0) {
      if (projectedHotspots.length > 0) setProjectedHotspots([]);
      return;
    }

    const cam = cameraRef.current;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const camForward = new THREE.Vector3();
    cam.getWorldDirection(camForward);

    const projected: ProjectedHotspot[] = hotspots.map((spot) => {
      const pos = new THREE.Vector3(spot.pos_x, spot.pos_y, spot.pos_z);
      const dot = pos.clone().normalize().dot(camForward);
      const isVisible = dot > 0.1;

      const projectedVec = pos.clone().project(cam);
      const screenX = (projectedVec.x * 0.5 + 0.5) * w;
      const screenY = (-(projectedVec.y * 0.5) + 0.5) * h;
      const isCorrect = isAnsweredCorrectly ? isAnsweredCorrectly(spot.id) : false;

      return {
        hotspot: spot,
        screenX,
        screenY,
        isVisible,
        isCorrect,
      };
    });

    setProjectedHotspots(projected);
  }, [hotspots, isAnsweredCorrectly]);

  // Load Panorama Texture with resilient fallback handling
  useEffect(() => {
    if (!sphereMeshRef.current || !panoramaUrl) return;

    setIsLoadingTexture(true);
    setLoadError(null);

    const loader = textureLoaderRef.current || new THREE.TextureLoader();
    try {
      loader.setCrossOrigin('anonymous');
    } catch {
      // Ignore if not supported
    }

    const primaryUrl = resolvePanoramaUrl(panoramaUrl);
    const fallbackUrl = getBundledFallbackUrl(panoramaUrl);

    let isCancelled = false;

    const applyTexture = (texture: THREE.Texture) => {
      if (isCancelled || !sphereMeshRef.current) return;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
      });
      sphereMeshRef.current.material = mat;
      setIsLoadingTexture(false);
      setLoadError(null);
    };

    const tryLoad = (urlToLoad: string, useFallbackOnFail: boolean) => {
      loader.load(
        urlToLoad,
        (texture) => {
          applyTexture(texture);
        },
        undefined,
        (err) => {
          if (isCancelled) return;
          console.warn(`Texture load failed for ${urlToLoad}:`, err);
          if (useFallbackOnFail && fallbackUrl && fallbackUrl !== urlToLoad) {
            console.info(`Attempting fallback bundled texture: ${fallbackUrl}`);
            tryLoad(fallbackUrl, false);
          } else {
            setLoadError('خطا در بارگذاری تصویر ۳۶۰ درجه. لطفاً دوباره تلاش کنید.');
            setIsLoadingTexture(false);
          }
        }
      );
    };

    tryLoad(primaryUrl, true);

    return () => {
      isCancelled = true;
    };
  }, [panoramaUrl, loadAttempt]);

  // High-performance Pointer & Touch Controls for Mobile and Desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Track active pointer position
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }

    if (activePointers.current.size === 1) {
      isUserInteracting.current = true;
      pointerDownStartPos.current = { x: e.clientX, y: e.clientY };
      lastPointerTime.current = performance.now();
      velLon.current = 0;
      velLat.current = 0;
      initialPinchDist.current = null;
    } else if (activePointers.current.size === 2) {
      // 2 fingers = initiate pinch zoom
      const pts = Array.from(activePointers.current.values());
      initialPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchFov.current = fov.current;
      velLon.current = 0;
      velLat.current = 0;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;

    const prevPos = activePointers.current.get(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && isUserInteracting.current && prevPos) {
      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;
      const now = performance.now();
      const dt = Math.max(1, now - lastPointerTime.current);

      // Adapt drag sensitivity to current field of view for natural touch response
      const factor = (fov.current / 380) * 0.22;
      const moveLon = -dx * factor;
      const moveLat = dy * factor;

      targetLon.current += moveLon;
      targetLat.current += moveLat;

      // Track instantaneous velocity for smooth release momentum/inertia
      const instantVx = moveLon / (dt / 16.67);
      const instantVy = moveLat / (dt / 16.67);
      velLon.current = velLon.current * 0.35 + instantVx * 0.65;
      velLat.current = velLat.current * 0.35 + instantVy * 0.65;

      lastPointerTime.current = now;
    } else if (activePointers.current.size >= 2) {
      // Pinch to zoom with 2 fingers
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (initialPinchDist.current && initialPinchDist.current > 0) {
        const scale = initialPinchDist.current / currentDist;
        const newFov = THREE.MathUtils.clamp(initialPinchFov.current * scale, 35, 100);
        fov.current = newFov;
        if (cameraRef.current) {
          cameraRef.current.fov = newFov;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }

    if (activePointers.current.size === 0) {
      isUserInteracting.current = false;
      initialPinchDist.current = null;

      // Clamp velocity momentum so quick flicks feel silky but don't spin uncontrollably
      velLon.current = Math.max(-3.8, Math.min(3.8, velLon.current));
      velLat.current = Math.max(-2.8, Math.min(2.8, velLat.current));
    } else if (activePointers.current.size === 1) {
      // Transitioned from pinch zoom back to 1 finger
      lastPointerTime.current = performance.now();
      velLon.current = 0;
      velLat.current = 0;
    }
  };

  // Wheel Zoom for desktop mice
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.05;
    const newFov = THREE.MathUtils.clamp(fov.current + zoomDelta, 35, 100);
    fov.current = newFov;

    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // Admin Raycasting for 3D Hotspot Placement
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!placementMode || !onSphereClick) return;

    // Check if pointer actually moved (if dragged, don't place)
    const dist = Math.hypot(
      e.clientX - pointerDownStartPos.current.x,
      e.clientY - pointerDownStartPos.current.y
    );
    if (dist > 8) return;

    if (!containerRef.current || !cameraRef.current || !sphereMeshRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObject(sphereMeshRef.current);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const normalized = point.clone().normalize().multiplyScalar(440);
      const coords = {
        x: Math.round(normalized.x),
        y: Math.round(normalized.y),
        z: Math.round(normalized.z),
      };
      setLastPlacedPoint(coords);
      onSphereClick(coords);
    }
  };

  // Directional navigation (Nudge on click + Hold to pan)
  const handleNudge = (direction: 'left' | 'right' | 'up' | 'down') => {
    const angleStep = 28;
    if (direction === 'left') {
      targetLon.current -= angleStep;
      velLon.current = -0.4;
    } else if (direction === 'right') {
      targetLon.current += angleStep;
      velLon.current = 0.4;
    } else if (direction === 'up') {
      targetLat.current = Math.min(85, targetLat.current + angleStep * 0.6);
      velLat.current = 0.3;
    } else if (direction === 'down') {
      targetLat.current = Math.max(-85, targetLat.current - angleStep * 0.6);
      velLat.current = -0.3;
    }
  };

  const startHoldPan = (direction: 'left' | 'right' | 'up' | 'down') => {
    holdDirectionRef.current = direction;
    velLon.current = 0;
    velLat.current = 0;
  };

  const stopHoldPan = () => {
    holdDirectionRef.current = null;
  };

  // Zoom controls
  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -15 : 15;
    const newFov = THREE.MathUtils.clamp(fov.current + delta, 35, 100);
    fov.current = newFov;
    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleResetView = () => {
    targetLon.current = initialYaw;
    targetLat.current = initialPitch;
    velLon.current = 0;
    velLat.current = 0;
    fov.current = initialFov;
    if (cameraRef.current) {
      cameraRef.current.fov = initialFov;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-full select-none overflow-hidden bg-[#0a0d11] touch-none ${
        placementMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onWheel={handleWheel}
      onClick={handleContainerClick}
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} style={{ touchAction: 'none' }} className="w-full h-full block touch-none" />

      {/* Loading Overlay */}
      {isLoadingTexture && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/85 backdrop-blur-md text-white transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 border-3 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium tracking-wide text-slate-200">
            در حال بارگذاری محیط ۳۶۰ درجه...
          </p>
          <span className="text-xs text-slate-400 mt-1">کیفیت Equirectangular 4K</span>
        </div>
      )}

      {/* Seamless Story Transition Overlay */}
      <div
        className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-black transition-opacity duration-700 pointer-events-none ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-md text-center p-6 space-y-3">
          <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white tracking-wide">{stageTitle}</h3>
          <p className="text-xs text-teal-300 leading-relaxed font-medium">{transitionMessage}</p>
        </div>
      </div>

      {/* Error State */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0d1117]/90 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            !
          </div>
          <p className="text-sm font-semibold text-rose-300 mb-2">{loadError}</p>
          <button
            onClick={() => setLoadAttempt((a) => a + 1)}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-xs font-bold rounded-xl text-slate-950 transition-colors shadow-lg cursor-pointer"
          >
            تلاش مجدد بارگذاری تصویر
          </button>
        </div>
      )}

      {/* Placement Mode Banner */}
      {placementMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-500/90 text-slate-950 font-medium text-xs rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-amber-300 pointer-events-none">
          <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
          <span>حالت جانمایی: روی هر نقطه از تصویر ۳۶۰ کلیک کنید تا نقطه تعاملی ایجاد شود</span>
        </div>
      )}

      {/* 2D Projected Hotspot Pins */}
      {!isLoadingTexture &&
        projectedHotspots.map(({ hotspot, screenX, screenY, isVisible, isCorrect }) => {
          if (!isVisible) return null;

          const isQuestion = hotspot.hotspot_type === 'question';

          return (
            <div
              key={hotspot.id}
              style={{
                left: `${screenX}px`,
                top: `${screenY}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 pointer-events-auto group"
              onClick={(e) => {
                e.stopPropagation();
                if (!placementMode && onHotspotClick) {
                  onHotspotClick(hotspot);
                }
              }}
              onMouseEnter={() => setActiveTooltipId(hotspot.id)}
              onMouseLeave={() => setActiveTooltipId(null)}
            >
              {/* Hotspot Pin Icon */}
              <button
                type="button"
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-2xl cursor-pointer ${
                  isQuestion
                    ? isCorrect
                      ? 'bg-emerald-600 text-white border-2 border-emerald-300 shadow-emerald-500/50'
                      : 'bg-amber-500 text-slate-950 border-2 border-amber-200 hotspot-glow-gold animate-pulse'
                    : 'bg-teal-600 text-white border-2 border-teal-300 hotspot-glow-teal'
                }`}
                title={hotspot.title}
                aria-label={hotspot.title}
              >
                {isQuestion ? (
                  isCorrect ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="font-bold text-lg select-none">؟</span>
                  )
                ) : (
                  <Info className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>

              {/* Tooltip Card on Hover */}
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg glass-panel-card text-right shadow-2xl transition-all duration-150 pointer-events-none ${
                  activeTooltipId === hotspot.id
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-2 scale-95'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1 border-b border-white/10 pb-1">
                  <span>{isQuestion ? 'سؤال آزمون' : 'اطلاعات سناریو'}</span>
                  {isQuestion && (
                    <span className={isCorrect ? 'text-emerald-400' : 'text-amber-400'}>
                      {isCorrect ? 'پاسخ داده شد ✓' : 'پاسخ داده نشده'}
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-white line-clamp-2">{hotspot.title}</div>
                <div className="text-[10px] text-teal-400 mt-1 font-sans">برای پاسخ کلیک کنید</div>
              </div>
            </div>
          );
        })}

      {/* Floating Bottom Navigation / Controls HUD with Directional and Auto-Rotate Controls */}
      <div
        className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 glass-panel rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl max-w-[95vw] overflow-x-auto select-none"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Directional Movement Controls (Nudge + Hold) */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-0.5 border border-white/5">
          {/* Rotate Left (Pan Left) */}
          <button
            onClick={() => handleNudge('left')}
            onMouseDown={() => startHoldPan('left')}
            onMouseUp={stopHoldPan}
            onMouseLeave={stopHoldPan}
            onTouchStart={() => startHoldPan('left')}
            onTouchEnd={stopHoldPan}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
            title="چرخش به چپ (کلیک یا نگه داشتن)"
            aria-label="Rotate Left"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Look Up */}
          <button
            onClick={() => handleNudge('up')}
            onMouseDown={() => startHoldPan('up')}
            onMouseUp={stopHoldPan}
            onMouseLeave={stopHoldPan}
            onTouchStart={() => startHoldPan('up')}
            onTouchEnd={stopHoldPan}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
            title="دید به بالا"
            aria-label="Look Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Look Down */}
          <button
            onClick={() => handleNudge('down')}
            onMouseDown={() => startHoldPan('down')}
            onMouseUp={stopHoldPan}
            onMouseLeave={stopHoldPan}
            onTouchStart={() => startHoldPan('down')}
            onTouchEnd={stopHoldPan}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
            title="دید به پایین"
            aria-label="Look Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Rotate Right (Pan Right) */}
          <button
            onClick={() => handleNudge('right')}
            onMouseDown={() => startHoldPan('right')}
            onMouseUp={stopHoldPan}
            onMouseLeave={stopHoldPan}
            onTouchStart={() => startHoldPan('right')}
            onTouchEnd={stopHoldPan}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 active:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
            title="چرخش به راست (کلیک یا نگه داشتن)"
            aria-label="Rotate Right"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

        {/* Auto Rotate Toggle with Active Glow */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1 px-2.5 h-8 sm:h-9 rounded-xl transition-all cursor-pointer text-xs font-bold ${
            autoRotate
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/40 ring-1 ring-teal-300'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
          title={autoRotate ? 'توقف گردش خودکار' : 'فعال‌سازی گردش خودکار ۳۶۰ درجه'}
          aria-label="Toggle Auto Rotate"
        >
          {autoRotate ? (
            <>
              <Pause className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span className="hidden sm:inline text-[11px]">گردش فعال</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline text-[11px]">گردش خودکار</span>
            </>
          )}
        </button>

        {/* Speed Multiplier Button (Shown when auto rotate is on) */}
        {autoRotate && (
          <button
            onClick={() => setRotateSpeed((s) => (s === 1 ? 2 : 1))}
            className="px-2 h-8 sm:h-9 flex items-center justify-center text-[10px] font-mono font-bold text-teal-300 bg-teal-950/60 border border-teal-500/40 rounded-xl hover:bg-teal-900/60 transition-colors cursor-pointer"
            title="تغییر سرعت گردش خودکار"
          >
            {rotateSpeed === 1 ? '۱× سرعت' : '۲× سریع'}
          </button>
        )}

        <div className="w-[1px] h-6 bg-white/10 mx-0.5 shrink-0" />

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          title="بزرگ‌نمایی"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          title="کوچک‌نمایی"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Reset View */}
        <button
          onClick={handleResetView}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          title="تنظیم مجدد زاویه دید به حالت اولیه"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Hint Floating Pill */}
      <div className="md:hidden absolute bottom-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black/60 border border-white/10 text-[10px] text-slate-300 rounded-full backdrop-blur-md pointer-events-none whitespace-nowrap">
        برای گردش دست را بکشید · برای زوم دو انگشت را باز کنید
      </div>
    </div>
  );
};
