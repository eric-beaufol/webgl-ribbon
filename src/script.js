import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Base
 */

// Constants
const MOUSE = new THREE.Vector2()


// Debug
const params = {
  roughness: 0.57,
  metalness: .1
}

// Stats
const stats = new Stats()
document.body.appendChild(stats.dom)

// canvas
const canvas = document.querySelector('canvas.webgl')

// Scenes
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Render target
 */


/**
 * Camera
 */
// Base camera
const { width, height } = sizes
const camera = new THREE.PerspectiveCamera(75, width / height, .1, 100)
camera.position.set(1, 2, 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.autoRotateSpeed = 0.5
// controls.autoRotate = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setClearColor(0xffffff, 1)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.shadowMap.type = THREE.VSMShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

function onResize() {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', onResize)

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Update controls
  controls.update(elapsedTime)

  // Ribbon
  ribbon.material.forEach((material, index) => {
    material.map.offset.x += deltaTime * 0.05 * (index ? -1 : 1)

    // Offset alphaMap justonce because the same texture is used by the two materials
    if (!index) {
      material.alphaMap.offset.x += deltaTime * 0.05
    }
    material.roughness = params.roughness
    material.metalness = params.metalness

    material.needsUpdate = true
  })

  // Lights
  // lights.forEach(light => {
  //   light.position.x += Math.cos(elapsedTime) * 0.02
  //   light.position.z += Math.sin(elapsedTime) * 0.02
  //   light.lookAt(scene.position)
  // })

  renderer.render(scene, camera)

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

const lights = []
const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, .6)
  scene.add(ambientLight)

  const lightShadowMapSize = 3
  const directionalLight = new THREE.DirectionalLight(0xffffff, .7)
  directionalLight.position.set(1, 2, 4)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.1
  directionalLight.shadow.camera.far = 15
  directionalLight.shadow.camera.top = lightShadowMapSize
  directionalLight.shadow.camera.bottom = -lightShadowMapSize
  directionalLight.shadow.camera.left = -lightShadowMapSize
  directionalLight.shadow.camera.right = lightShadowMapSize
  directionalLight.shadow.bias = -0.001;

  scene.add(directionalLight)

  const directionalLight1 = directionalLight.clone()
  directionalLight1.intensity = 0.2
  directionalLight1.position.x = -2
  scene.add(directionalLight1)

  const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 1, 0x00ff00)
  // scene.add(lightHelper)

  const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
  // scene.add(shadowHelper)

  lights.push(directionalLight, directionalLight1)
}

const addHelper = () => {
  scene.add(
    new THREE.GridHelper()
  )
}

let ribbon, curveObject
const addRibbon = () => {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 30, 30),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  )

  // scene.add(sphere)

  const pointsLen = 7
  const pointsArr = []
  
  // add point around a sphere of radius 1
  for (let i = 0; i < pointsLen; i++) {
    const randomness = Math.random() - 0.5

    const phi = Math.PI / 2 + randomness
    const theta = i / pointsLen * Math.PI * 2

    pointsArr.push(
      new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
    )
  }

  //Create a closed wavey loop
  const curve = new THREE.CatmullRomCurve3(pointsArr, true, 'catmullrom')

  const points = curve.getPoints(150)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 })

  // Create the final object to add to the scene
  curveObject = new THREE.Line(geometry, material)
  // scene.add(curveObject)

  const number = 1000
  const frenetFrames = curve.computeFrenetFrames(number, true)
  const spacedPoints = curve.getSpacedPoints(number)
  const distances = [-0.15, 0.15]
  const finalPoints = []

  const frontTexture = new THREE.TextureLoader().load('/ribbon-front.png')
  const backTexture = new THREE.TextureLoader().load('/ribbon-back.png')

  const textures = [frontTexture, backTexture]

  textures.forEach((texture, index) => {
    texture.wrapS = 1000
    texture.wrapT = 1000
    if (index === 0) {
      texture.repeat.set(1, -1)
    } else {
      texture.repeat.set(-1, -1)
    }
    
    texture.offset.setX(0.5)
  })

  const alphamapTexture = new THREE.TextureLoader().load('/ribbon-alphamap.png')
  alphamapTexture.wrapS = 1000
  alphamapTexture.wrapT = 1000
  alphamapTexture.repeat.set(1, 1)
  alphamapTexture.offset.setX(0.5)
  
  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    // color: 'red',
    side: THREE.BackSide,
    alphaTest: .5,
    // flatShading: true,
    alphaMap: alphamapTexture,
    wireframe: false,
    metalness: params.metalness,
    roughness: params.roughness,
    transparent: true
  })

  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    // color: 'black',
    side: THREE.FrontSide,
    alphaTest: .5,
    alphaMap: alphamapTexture,
    // flatShading: true,
    wireframe: false,
    metalness: params.metalness,
    roughness: params.roughness,
    transparent: true
  })

  const ribbonMaterials = [frontMaterial, backMaterial]
  const ribbonGeometry = new THREE.PlaneGeometry(1, 1, number)
  ribbonGeometry.addGroup(0, 6000, 0)
  ribbonGeometry.addGroup(0, 6000, 1)

  ribbon = new THREE.Mesh(
    ribbonGeometry,
    ribbonMaterials
  )

  distances.forEach(dist => {
    let firstPointClone

    for (let i = 0; i < number; i++) {
      const point = new THREE.Vector3().copy(spacedPoints[i])
      const binormal = new THREE.Vector3().copy(frenetFrames.binormals[i])
      point.add(binormal.multiplyScalar(dist))
      finalPoints.push(point)

      if (i === 0) {
        firstPointClone = point.clone()
      }
    }

    finalPoints.push(firstPointClone)
  })

  ribbon.geometry.setFromPoints(finalPoints)
  ribbon.geometry.computeVertexNormals()
  ribbon.castShadow = true
  ribbon.receiveShadow = true

  // ribbon.rotation.set(
  //   Math.random() * Math.PI * 2,
  //   Math.random() * Math.PI * 2,
  //   Math.random() * Math.PI * 2
  // )

  scene.add(ribbon)
  
  params.reset = () => {
    scene.remove(ribbon)
    scene.remove(curveObject)
    addRibbon()
  }
}

const addPlane = () => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      // color: 0xd7fdd2,
      color: 0xffffff,
      // emissive: 0xffffff,
      wireframe: false,
      side: THREE.DoubleSide
    })
  )

  mesh.rotateX(Math.PI / 2)
  mesh.position.y = -1
  mesh.receiveShadow = true

  scene.add(mesh)
}

const addSmallPlane = () => {
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('/semi-opaque-texture.png')
  texture.minFilter = texture.magFilter = THREE.NearestFilter

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaMap: textureLoader.load('/alphamap.png'),
      alphaTest: .5
    })
  )
  // mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.position.y = -.5
  mesh.position.x = 2 
  scene.add(mesh)
}

const addBox = () => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(.4, .4, .4),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  )
  mesh.position.x = -2
  mesh.position.y = -.5
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
}

let gui
const addGUI = () => {
  gui = new dat.GUI()

  gui.add(params, 'roughness', 0, 1, .001)
  gui.add(params, 'metalness', 0, 1, .001)
  gui.add(params, 'reset')
}

const addEvents = () => {
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX - sizes.width / 2
    MOUSE.y = - e.clientY + sizes.height / 2
  })
}

addEvents()
addRibbon()
addPlane()
// addSmallPlane()
// addBox()
addLights()
addGUI()
// addHelper()
tick()
