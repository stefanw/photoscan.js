/* globals self, cv */

import PhotoScan from './photoscan'

self.importScripts('./opencv.js')

self.postMessage({type: 'state', data: 'ready'})

function logCallback (data) {
  sendMessage('log', data)
}

function progressCallback (data) {
  return sendMessage('progress', data)
}

function sendMessage (type, data) {
  self.postMessage({
    type: type,
    data: data
  })
}

function processImage (imageData, width, height, options) {
  let psOptions = {
    progressCallback: progressCallback
  }
  if (options.debug) {
    psOptions.logCallback = logCallback
  }
  let photoscan = new PhotoScan(cv, psOptions)
  let result = photoscan.process(imageData, width, height, options)
  self.postMessage({type: 'result', data: result})
}

// Respond to message from parent thread
self.addEventListener('message', (event) => {
  self.postMessage({type: 'progress', data: {message: 'started', progress: 10}})
  processImage(
    event.data.imageData,
    event.data.width, event.data.height,
    event.data.options
  )
})

export default self
