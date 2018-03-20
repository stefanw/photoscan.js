<template>
  <div>
    <h3>Take a picture of your document</h3>
    <photo-scan :debug="debug"></photo-scan>
  </div>
</template>

<script>

import PhotoScan from './components/photoscan'

export default {
  name: 'photoscan-app',
  data () {
    return {
        debug: false
    }
  },
  components: {
    PhotoScan
  }
}
</script>
