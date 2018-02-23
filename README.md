# photoscanjs

JS library and Vue component to take a user provided picture, detect a document and transform that part of the picture to get a scan-like image of the document.

*Warning*: this uses opencv.js which is 11 MB of JavaScript and uses a lot of memory. This project was tested on some mobiles, but only works in memory-limited environment when the app's internal debug mode is turned off. This might severly limit your mobile use case. [jsfeat](https://inspirit.github.io/jsfeat/) could be an alternative, but seems to be missing some features that are needed and available in OpenCV like contour detection.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build
```


## Credits

Inspired by [this article on pyimagesearch.com](https://www.pyimagesearch.com/2014/09/01/build-kick-ass-mobile-document-scanner-just-5-minutes/).