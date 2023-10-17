import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import cubeFragment from './shaders/cube/fragment.glsl'
import cubeVertex from './shaders/cube/vertex.glsl'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

/**
 * Base
 */

// Constants
const MOUSE = new THREE.Vector2()


// Debug
const params = {
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
const camera = new THREE.PerspectiveCamera(75, width / height, .1, 10)
camera.position.set(0, 0, 1.8)
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
renderer.shadowMap.type = THREE.PCFSoftShadowMap
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

  renderer.render(scene, camera)

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

const addPoints = () => {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 30, 30),
    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  )

  scene.add(sphere)

  const pointsLen = 7
  const pointsArr = []
  
  // add point around a sphere of radius 1
  for (let i = 0; i < pointsLen; i++) {
    const phi = Math.PI / 2 + (Math.random() - 0.5)
    const theta = i / pointsLen * Math.PI * 2

    pointsArr.push(
      new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
    )
  }

  //Create a closed wavey loop
  const curve = new THREE.CatmullRomCurve3(pointsArr, true, 'catmullrom')

  const points = curve.getPoints(50)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)

  const material = new THREE.LineBasicMaterial({ color: 0xff0000 })

  // Create the final object to add to the scene
  const curveObject = new THREE.Line(geometry, material)
  scene.add(curveObject)

  const number = 1000
  const frenetFrames = curve.computeFrenetFrames(number, true)
  const spacedPoints = curve.getSpacedPoints(number)
  const distances = [-0.1, 0.1]
  const finalPoints = []

  const ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, number - 1),
    new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true })
  )

  distances.forEach(dist => {
    for (let i = 0; i < number; i++) {
      const point = new THREE.Vector3().copy(spacedPoints[i])
      const binormal = new THREE.Vector3().copy(frenetFrames.binormals[i])
      point.add(binormal.multiplyScalar(dist))
      finalPoints.push(point)
    }
  })

  ribbon.geometry.setFromPoints(finalPoints)

  scene.add(ribbon)
  
}

let gui
const addGUI = () => {
  gui = new dat.GUI()
}

const addEvents = () => {
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX - sizes.width / 2
    MOUSE.y = - e.clientY + sizes.height / 2
  })
}

addEvents()
addPoints()
addGUI()
tick()
