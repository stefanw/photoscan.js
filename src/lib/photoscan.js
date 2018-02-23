/* globals ImageData */
const RED = [255, 0, 0, 0]
const DPI = 150
const DPMM = DPI * (1 / 25.4)
const DEFAULT_PAPER_SIZE = 'A4'
const PAPER_SIZE = { // in mm
  A4: [210, 297]
}

const LOG_TOTAL = 10

class PhotoScan {
  constructor (cv, options) {
    this.cv = cv
    this.options = options
    this.debug = !!this.options.logCallback
  }
  logProgress (src, message, points) {
    this.logCount += 1
    if (this.options.progressCallback) {
      this.options.progressCallback({
        progress: Math.floor(this.logCount / LOG_TOTAL * 100),
        message: message,
        points: points
      })
    }
    if (this.options.logCallback && src) {
      let imageData = this.toImageData(src)
      this.options.logCallback({
        progress: Math.floor(this.logCount / LOG_TOTAL * 100),
        message: message,
        width: src.cols,
        height: src.rows,
        imageData: imageData
      })
    }
  }
  toImageData (mat) {
    // Taken from opencv.js
    const cv = this.cv
    var img = new cv.Mat()
    var depth = mat.type() % 8
    var scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255
    var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0
    mat.convertTo(img, cv.CV_8U, scale, shift)
    switch (img.type()) {
      case cv.CV_8UC1:
        cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA)
        break
      case cv.CV_8UC3:
        cv.cvtColor(img, img, cv.COLOR_RGB2RGBA)
        break
      case cv.CV_8UC4:
        break
      default:
        throw new Error('Bad number of channels (Source image must have 1, 3 or 4 channels)')
    }
    return new ImageData(
      new Uint8ClampedArray(img.data), img.cols, img.rows
    )
  }
  resize (src, options) {
    return resize(this.cv, src, options)
  }
  prepareImage (src) {
    const cv = this.cv

    let gray = new this.cv.Mat()
    let blur = new this.cv.Mat()
    let dst = new this.cv.Mat()

    const options = {
      gaussianBlurSize: 5, // must be odd
      cannyThreshold1: 145,
      cannyThreshold2: 310,
      cannyApertureSize: 5,
      cannyL2Gradient: false
    }

    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    this.logProgress(gray, 'Gray')
    cv.GaussianBlur(gray, blur, {width: options.gaussianBlurSize, height: options.gaussianBlurSize}, 0, 0, cv.BORDER_DEFAULT)
    this.logProgress(blur, 'Blurred')
    cv.Canny(blur, dst, options.cannyThreshold1, options.cannyThreshold2, options.cannyApertureSize, options.cannyL2Gradient)
    this.logProgress(dst, 'Edge detection')
    gray.delete()
    return dst
  }
  getPoints (src, landscape) {
    const cv = this.cv

    function sortContourFunc (a, b) {
      /* Sort largest value first */
      if (a.val < b.val) {
        return 1
      } else if (a.val > b.val) {
        return -1
      }
      return 0
    }

    const options = {
      contoursMode: cv.RETR_TREE,
      contoursMethod: cv.CHAIN_APPROX_SIMPLE
    }

    let contours = new cv.MatVector()
    let hierarchy = new cv.Mat()

    cv.findContours(
      src, contours, hierarchy,
      Number(options.contoursMode), Number(options.contoursMethod),
      {x: 0, y: 0}
    )

    const CONTOUR_COUNT = 3

    let topContours = []
    let allContourDst
    if (this.debug) {
      allContourDst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3)
    }

    for (let i = 0; i < contours.size(); ++i) {
      if (this.debug) {
        cv.drawContours(allContourDst, contours, i, RED, 1, cv.LINE_8, hierarchy)
      }
      let area = cv.contourArea(contours.get(i))

      topContours.push({val: area, index: i})
      topContours.sort(sortContourFunc)
      topContours = topContours.slice(0, CONTOUR_COUNT)
    }
    if (this.debug) {
      this.logProgress(allContourDst, 'all contours')
      allContourDst.delete()
    }

    let contourDst
    if (this.debug) {
      contourDst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3)
    }

    let pageCnt
    let indexContour = null

    for (let tc of topContours) {
      let c = contours.get(tc.index)

      if (this.debug) {
        cv.drawContours(contourDst, contours, tc.index, RED, 1, cv.LINE_8, hierarchy)
      }

      let approx = new cv.Mat()
      let arcLength = cv.arcLength(c, true)
      cv.approxPolyDP(c, approx, 0.02 * arcLength, true)
      console.log(tc.index, approx.rows)

      c.delete()
      if (approx.rows === 4) {
        pageCnt = approx
        indexContour = tc.index
        break
      }
    }

    if (this.debug) {
      this.logProgress(contourDst, 'top contours')
      contourDst.delete()
    }

    contours.delete()
    hierarchy.delete()

    if (indexContour === null) {
      /* We couldn't find a 4 corner contour! */
      let lines = new cv.Mat()
      let minLineLength = Math.floor(0.5 * (src.rows ? landscape : src.cols))
      cv.HoughLinesP(src, lines, 1, Math.PI / 360, 60, minLineLength, 30)
      /* find extreme lines that indicate borders */

      let maxRightTop = 0
      let maxRightBottom = 0
      let minLeftTop = Infinity
      let minLeftBottom = Infinity
      let minTopRight = Infinity
      let minTopLeft = Infinity
      let maxBottomLeft = 0
      let maxBottomRight = 0

      for (let i = 0; i < lines.rows; ++i) {
        let a = [lines.data32S[i * 4], lines.data32S[i * 4 + 1]]
        let b = [lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]]
        let horizontal = Math.abs(a[0] - b[0]) > Math.abs(a[1] - b[1])
        if (horizontal) {
          let ix
          let ax
          if (a[0] < b[0]) {
            ix = a[1]
            ax = b[1]
          } else {
            ix = b[1]
            ax = a[1]
          }
          minTopLeft = Math.min(minTopLeft, ix)
          minTopRight = Math.min(minTopRight, ax)
          maxBottomLeft = Math.max(maxBottomLeft, ix)
          maxBottomRight = Math.max(maxBottomRight, ax)
        } else {
          let ix
          let ax
          if (a[1] < b[1]) {
            ix = a[0]
            ax = b[0]
          } else {
            ix = b[0]
            ax = a[0]
          }
          maxRightTop = Math.max(maxRightTop, ix)
          maxRightBottom = Math.max(maxRightBottom, ax)
          minLeftTop = Math.min(minLeftTop, ix)
          minLeftBottom = Math.min(minLeftBottom, ax)
        }
      }

      if (this.debug) {
        let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3)

        for (let i = 0; i < lines.rows; ++i) {
          let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1])
          let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3])
          cv.line(dst, startPoint, endPoint, [Math.floor(Math.random() * 255), 255, Math.floor(Math.random() * 255), 0])
        }

        this.logProgress(dst, 'Fall back lines!')
        dst.delete()
      }

      lines.delete()

      let fallbackPoint = [
        [minLeftTop, minTopLeft], [maxRightTop, minTopRight],
        [maxRightBottom, maxBottomRight], [minLeftBottom, maxBottomLeft]
      ]

      src.delete()

      return fallbackPoint
    }

    src.delete()

    console.log(pageCnt)

    let d = pageCnt.data32S
    return [[d[0], d[1]], [d[2], d[3]], [d[4], d[5]], [d[6], d[7]]]
  }

  crop (warped, width, height) {
    const cv = this.cv
    let warpSize = warped.size()
    let rect = new cv.Rect(
      0, 0,
      Math.min(warpSize.width, width),
      Math.min(warpSize.height, height)
    )
    console.log(rect, warped.size(), warped.cols, warped.rows)

    let dst = cv.Mat.zeros(rect.width, rect.height, cv.CV_8UC3)
    dst = warped.roi(rect)

    this.logProgress(dst, 'Cropped')
    return dst
  }

  fillEdge (dst, ix, iy, ax, ay, bx, by, maxLines) {
    /*
    ix, iy starting point
    ax, ay: walk along edge
    bx, by: reset params to walk next line down the edge

    */
    maxLines = maxLines || 10
    let found = true
    let lineCount = 0
    while (found && lineCount < maxLines) {
      found = false
      while (ix < dst.cols && iy < dst.rows && ix >= 0 && iy >= 0) {
        let coord = iy * dst.cols + ix
        let v = dst.data[coord]
        if (v < 255) {
          found = true
          dst.data[coord] = 255
        }
        ix += ax
        iy += ay
      }
      ix += bx
      iy += by
      lineCount += 1
    }
  }
  makeBlackWhite (dst) {
    const cv = this.cv

    cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0)

    let dst2 = new cv.Mat()
    cv.GaussianBlur(dst, dst2, {width: 0, height: 0}, 3, 0, cv.BORDER_DEFAULT)
    cv.addWeighted(dst, 1.5, dst2, -0.5, 0, dst2, -1)

    cv.threshold(dst2, dst2, 150, 255, cv.THRESH_BINARY)
    // cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 3, 2)
    this.logProgress(dst2, 'Thresholded')
    // Fill edge right
    this.fillEdge(dst2, dst2.cols - 1, 0, 0, 1, -1, -dst2.rows)
    // Fill edge top
    this.fillEdge(dst2, 0, 0, 1, 0, -dst2.cols, 1)
    // Fill edge bottom
    this.fillEdge(dst2, 0, dst2.rows - 1, 1, 0, -dst2.cols, -1)
    // Fill edge left
    this.fillEdge(dst2, 0, 0, 0, 1, 1, -dst2.rows)

    this.logProgress(dst2, 'Edge clean')

    return dst2
  }

  process (imageData, width, height, options) {
    const cv = this.cv
    this.logCount = 0

    let original = cv.matFromImageData(imageData)
    imageData = null

    let landscape = false
    if (width > height) {
      landscape = true
    }

    const MIN_HEIGHT = 800

    let ratio
    let resizeOptions
    if (landscape) {
      resizeOptions = {width: MIN_HEIGHT}
      ratio = original.cols / MIN_HEIGHT
    } else {
      resizeOptions = {height: MIN_HEIGHT}
      ratio = original.rows / MIN_HEIGHT
    }

    let src = this.resize(original, resizeOptions)
    let prepared = this.prepareImage(src)
    let points = this.getPoints(prepared, landscape)
    src.delete()

    console.log(points)
    points = points.map((x) => [x[0] * ratio, x[1] * ratio])
    console.log(ratio, points)
    this.logProgress(null, 'points', points)

    if (this.debug) {
      let annotated = original.clone()
      for (let i = 0; i < points.length; i++) {
        cv.line(
          annotated,
          new cv.Point(points[i][0], points[i][1]),
          new cv.Point(points[(i + 1) % 4][0], points[(i + 1) % 4][1]),
          RED, 10, cv.LINE_AA, 0
        )
      }
      this.logProgress(annotated, 'annotated')
      annotated.delete()
    }

    let warpedObject = fourPointTransform(cv, original, points)
    let warped = warpedObject.warped
    this.logProgress(warped, 'Warped')

    let dst = this.crop(warped, warpedObject.width, warpedObject.height)
    this.logProgress(dst, 'Cropped')
    warped.delete()

    if (options.blackwhite) {
      dst = this.makeBlackWhite(dst)
    }

    const paperSize = PAPER_SIZE[DEFAULT_PAPER_SIZE]
    if (landscape) {
      resizeOptions = {width: Math.floor(DPMM * paperSize[1])}
    } else {
      resizeOptions = {width: Math.floor(DPMM * paperSize[0])}
    }

    let final = this.resize(dst, resizeOptions)
    dst.delete()

    imageData = this.toImageData(final)
    let result = {
      imageData: imageData,
      width: final.cols,
      height: final.rows
    }
    final.delete()
    return result
  }
}

function orderPoints (pts) {
  // initialzie a list of coordinates that will be ordered
  // such that the first entry in the list is the top-left,
  // the second entry is the top-right, the third is the
  // bottom-right, and the fourth is the bottom-left

  // the top-left point will have the smallest sum, whereas
  // the bottom-right point will have the largest sum
  let max = 0
  let min = Infinity
  let diffMax = -Infinity
  let diffMin = Infinity
  let maxIndex, minIndex, diffMaxIndex, diffMinIndex
  for (let i = 0; i < pts.length; i += 1) {
    let pt = pts[i]
    let s = pt[0] + pt[1]
    let d = pt[0] - pt[1]
    if (s > max) {
      max = s
      maxIndex = i
    }
    if (s < min) {
      min = s
      minIndex = i
    }
    if (d > diffMax) {
      diffMax = d
      diffMaxIndex = i
    }
    if (d < diffMin) {
      diffMin = d
      diffMinIndex = i
    }
  }

  return [pts[minIndex], pts[diffMaxIndex], pts[maxIndex], pts[diffMinIndex]]
}

function flatten (arr) {
  const flat = [].concat(...arr)
  return flat.some(Array.isArray) ? flatten(flat) : flat
}

function fourPointTransform (cv, src, pts) {
  // obtain a consistent order of the points and unpack them
  // individually
  let rect = orderPoints(pts)
  let [tl, tr, br, bl] = rect

  // compute the width of the new image, which will be the
  // maximum distance between bottom-right and bottom-left
  // x-coordiates or the top-right and top-left x-coordinates
  let widthA = Math.sqrt(Math.pow(br[0] - bl[0], 2) + Math.pow(br[1] - bl[1], 2))
  let widthB = Math.sqrt(Math.pow(tr[0] - tl[0], 2) + Math.pow(tr[1] - tl[1], 2))
  let maxWidth = Math.max(Math.floor(widthA), Math.floor(widthB))
  //
  // compute the height of the new image, which will be the
  // maximum distance between the top-right and bottom-right
  // y-coordinates or the top-left and bottom-left y-coordinates
  let heightA = Math.sqrt(Math.pow(tr[0] - br[0], 2) + Math.pow(tr[1] - br[1], 2))
  let heightB = Math.sqrt(Math.pow(tl[0] - bl[0], 2) + Math.pow(tl[1] - bl[1], 2))
  let maxHeight = Math.max(Math.floor(heightA), Math.floor(heightB))
  //
  // now that we have the dimensions of the new image, construct
  // the set of destination points to obtain a "birds eye view",
  // (i.e. top-down view) of the image, again specifying points
  // in the top-left, top-right, bottom-right, and bottom-left
  // order
  let dstRect = [
    [0, 0],
    [maxWidth - 1, 0],
    [maxWidth - 1, maxHeight - 1],
    [0, maxHeight - 1]
  ]
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, flatten(rect))
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, flatten(dstRect))
  let M = cv.getPerspectiveTransform(srcTri, dstTri)
  let dsize = new cv.Size(src.cols, src.rows)
  let warped = new cv.Mat()
  cv.warpPerspective(src, warped, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar())

  srcTri.delete()
  dstTri.delete()
  M.delete()

  return {warped: warped, width: maxWidth, height: maxHeight}
}

function resize (cv, image, options) {
  // initialize the dimensions of the image to be resized and
  // grab the image size
  let dim = null
  let w = image.cols
  let h = image.rows

  // if both the width and height are None, then return the
  // original image
  if (options.width === undefined && options.height === undefined) {
    return image
  }

  // check to see if the width is None
  if (options.width === undefined) {
    // calculate the ratio of the height and construct the
    // dimensions
    let r = options.height / h
    dim = [Math.floor(w * r), options.height]
  } else {
    // calculate the ratio of the width and construct the
    // dimensions
    let r = options.width / w
    dim = [options.width, Math.floor(h * r)]
  }

  // resize the image
  let dsize = new cv.Size(dim[0], dim[1])
  // You can try more different parameters
  let dst = new cv.Mat()
  cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA)

  // return the resized image
  return dst
}

export default PhotoScan
