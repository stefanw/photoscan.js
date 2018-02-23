<template>
  <div>
    <div>
      <label>
        <input type="checkbox" v-model="blackwhite"/>
        B/W
      </label>
    </div>
    <div>
      <label v-if="isMobile" :for="uploadInputId" class="photoscan-custom-upload">
        <i class="fa fa-cloud-upload"></i> Take picture
      </label>
      <input v-show="!isMobile" :id="uploadInputId" type="file" @change="imageCaptured" accept="image/*"/>
    </div>
    <div>
      <div class="progress">
        <div class="progress-bar" role="progressbar" :style="{width: progressPercent}" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100"></div>
      </div>
    </div>
    <div class="container">
      <div class="left">
        <canvas v-show="image" v-canvas-draw="canvasFeatures"></canvas>
      </div>
      <div class="right">
        <img v-if="scan" :src="scan" class="image"/>
      </div>
    </div>
    <div v-for="logImage in logImages" class="photoscan-log">
      <img :src="logImage.src" :title="logImage.title"/>
    </div>
  </div>
</template>

<script>

import PhotoScanWorker from '../lib/photoscan.worker.js'

export default {
  name: 'photoscan',
  props: {
    postfix: {
      default: '0',
      type: String
    },
    debug: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      file: null,
      image: null,
      scan: null,
      progress: 0,
      points: null,
      message: '',
      workerAvailable: false,
      workerReady: false,
      readyToProcess: false,
      working: false,
      blackwhite: true,
      logImages: []
    }
  },
  mounted () {
    this.initializeWorker()
  },
  computed: {
    isMobile () {
      // device detection
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    },
    progressPercent () {
      return this.progress + '%'
    },
    canvasFeatures () {
      return {
        image: this.image,
        points: this.points
      }
    },
    uploadInputId () {
      return `photoscan-fileupload-${this.postfix}`
    }
  },
  directives: {
    canvasDraw (canvas, binding) {
      let image = binding.value.image
      if (image === null) {
        return
      }
      let parent = canvas.parentNode
      let maxWidth = Math.min(parent.clientWidth, image.width)
      let ratio = maxWidth / image.width

      canvas.width = Math.floor(image.width * ratio)
      canvas.height = Math.floor(image.height * ratio)

      let ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      let points = binding.value.points
      if (points === null) {
        return
      }
      let r = ratio
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 5
      ctx.beginPath()
      for (let i = 0; i < points.length; i++) {
        ctx.moveTo(points[i][0] * r, points[i][1] * r)
        ctx.lineTo(points[(i + 1) % 4][0] * r, points[(i + 1) % 4][1] * r)
      }
      ctx.stroke()
    }
  },
  methods: {
    initializeWorker () {
      this.worker = new PhotoScanWorker()

      this.worker.addEventListener('message', (event) => {
        let ed = event.data
        console.log(ed.type)
        if (ed.type === 'progress') {
          this.progress = ed.data.progress
          this.message = ed.data.message
          if (ed.data.points) {
            this.points = ed.data.points
          }
        } else if (ed.type === 'state') {
          if (ed.data === 'ready') {
            this.workerReady = true
            this.message = 'ready'
            this.$emit('state', 'ready')
          }
        } else if (ed.type === 'log') {
          let imgUrl = this.imageDataToImageDataUrl(
            ed.data.imageData, ed.data.width, ed.data.height, ed.data.message
          )
          this.logImages = [
            {
              src: imgUrl,
              title: ed.data.message
            },
            ...this.logImages
          ]
        } else if (ed.type === 'result') {
          this.progress = 100
          this.message = ed.data.message
          let imgUrl = this.imageDataToImageDataUrl(
            ed.data.imageData, ed.data.width, ed.data.height
          )
          this.scan = imgUrl
          this.$emit('result', imgUrl)
          this.working = false
          this.workerAvailable = false
          this.worker.terminate()
        }
      })
      this.workerAvailable = true
    },
    ensureWorkerAvailable () {
      if (!this.workerAvailable) {
        this.initializeWorker()
      }
    },
    imageCaptured (event) {
      if (this.working) {
        this.worker.terminate()
        this.workerAvailable = false
      }
      this.readyToProcess = false
      this.image = null
      this.points = null
      this.file = event.target.files[0]
      this.prepareImage().then(() => {
        this.readyToProcess = true
        this.startProcessing()
      })
    },
    prepareImage () {
      return new Promise((resolve, reject) => {
        let img = new window.Image()
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight) {
            let canvas = this.getNewCanvas(img.naturalHeight, img.naturalWidth)
            let ctx = canvas.getContext('2d')
            this.drawRotated(canvas, ctx, img)
            let imgRotated = new window.Image()
            imgRotated.onload = () => {
              this.image = imgRotated
              resolve(this.image)
            }
            imgRotated.src = canvas.toDataURL('image/png')
          } else {
            this.image = img
            resolve(this.image)
          }
        }
        img.src = window.URL.createObjectURL(this.file)
      })
    },
    getNewCanvas (width, height) {
      let canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      return canvas
    },
    imageToImageData (image) {
      let canvas = this.getNewCanvas(image.width, image.height)
      let ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0, image.width, image.height)
      return ctx.getImageData(0, 0, image.width, image.height)
    },
    imageDataToImageDataUrl (imageData, width, height) {
      let canvas = this.getNewCanvas(width, height)
      let ctx = canvas.getContext('2d')
      ctx.putImageData(imageData, 0, 0)
      return canvas.toDataURL('image/png')
    },
    imageDataToImage (imageData, width, height, message) {
      let img = new window.Image()
      img.src = this.imageDataToImageDataUrl(imageData, width, height)
      img.title = message
      return img
    },
    drawRotated (canvas, ctx, img) {
      ctx.translate(canvas.width / 2, canvas.height / 2)

      // roate the canvas by +90% (==Math.PI/2)
      ctx.rotate(Math.PI / 2)

      // draw the signature
      // since images draw from top-left offset the draw by 1/2 width & height
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      // un-rotate the canvas by -90% (== -Math.PI/2)
      ctx.rotate(-Math.PI / 2)

      // un-translate the canvas back to origin==top-left canvas
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
    },
    startProcessing () {
      this.working = true
      this.ensureWorkerAvailable()
      this.progress = 0
      this.scan = null
      this.processImage()
    },
    processImage () {
      let image = this.image
      this.logImages = []
      let imageData = this.imageToImageData(image)
      this.worker.postMessage({
        command: 'process',
        imageData: imageData,
        width: image.width,
        height: image.height,
        options: {
          blackwhite: this.blackwhite,
          debug: this.debug
        }
      })
    }
  }
}
</script>

<style>
  .progress-bar {
    height: 0.5rem;
    background-color: #007bff;
    transition: width .6s ease;
  }
  .photoscan-custom-upload {
    padding: 1em;
    text-align: center;
    border: 1px solid gray;
    display: block;
  }
  .photoscan-custom-upload:active {
    background-color: gray;
  }
  .container {
    width: 100%;
    clear: left;
  }
  .left {
    float: left;
    width: 50%;
  }
  .right {
    float: right;
    width: 50%;
  }
  .image {
    max-width: 100%;
    image-orientation: 0deg;
  }
  .photoscan-log img {
    max-width: 100%;
    max-height: 100vh;
  }
</style>
