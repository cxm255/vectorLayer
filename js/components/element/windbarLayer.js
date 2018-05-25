/*
 * author: newcookie <453546488@qq.com>
 * windbarLayer v0.0.1
 * time: 2018-01-23
 * LICENSE: MIT
 * (c) 2017-2118 https://newcookie.github.io/vectorLayer/windbarLayer.html
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('openlayers')) :
        typeof define === 'function' && define.amd ? define(['openlayers'], factory) :
            (global.WindbarLayer = factory(global.ol));
}(this, (function (ol) {
    'use strict';

    ol = ol && ol.hasOwnProperty('default') ? ol['default'] : ol;

    var Windbar = function Windbar(params) {
        var LINE_WIDTH = 1; //宽度


        params.LINE_WIDTH = params.LINE_WIDTH || LINE_WIDTH;
        //console.log(params);



        var buildBounds = function buildBounds(bounds, width, height) {
            var upperLeft = bounds[0];
            var lowerRight = bounds[1];
            var x = Math.round(upperLeft[0]);
            var y = Math.max(Math.floor(upperLeft[1], 0), 0);
            var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
            return { x: x, y: y, xMax: width, yMax: yMax, width: width, height: height };
        };

        var deg2rad = function deg2rad(deg) {
            return deg / 180 * Math.PI;
        };

        var rad2deg = function rad2deg(ang) {
            return ang / (Math.PI / 180.0);
        };

        var mercY = function mercY(lat) {
            return Math.log(Math.tan(lat / 2 + Math.PI / 4));
        };

        var project = function project(lat, lon, windy) {
            var ymin = mercY(windy.south);
            var ymax = mercY(windy.north);
            var xFactor = windy.width / (windy.east - windy.west);
            var yFactor = windy.height / (ymax - ymin);

            var y = mercY(deg2rad(lat));
            var x = (deg2rad(lon) - windy.west) * xFactor;
            y = (ymax - y) * yFactor;
            return [x, y];
        };

        //判断是否在屏幕范围内
        var isInBounds = function (bounds, lng, lat) {
            var bound = _map.getBounds();
            if (lat > bound._northEast.lat || lat < bound._southWest.lat || lng > bound._northEast.lng || lng < bound._southWest.lng) {
                return false;
            } else {
                return true;
            };
        }

        var canvas = params.canvas;
        var g = canvas.getContext("2d");

        g.lineWidth = params.LINE_WIDTH;

        //绘制图层内的要素
        function draw(bounds, width, height, extent) {
            var mapBounds = {
                south: deg2rad(extent[0][1]),
                north: deg2rad(extent[1][1]),
                east: deg2rad(extent[1][0]),
                west: deg2rad(extent[0][0]),
                width: width,
                height: height
            };
            var bounds = buildBounds(bounds, width, height);

            //清除1
            clearDraw();


            var layerOptions = params._windbarLayer.$options;
            var map = params._windbarLayer.$Map || OL.openMap._map;
            var view = map.getView();
            var zoom = view.getZoom();
            if (layerOptions.drawtype == "wave") {
                zoom -= 3; //20180117特殊处理
            }
            if (zoom >= 6)
                zoom = 0;
            else if (zoom == 5)
                zoom = 1;
            else if (zoom == 4)
                zoom = 2;
            else if (zoom == 3)
                zoom = 3;
            else if (zoom == 2)
                zoom = 4;
            else
                zoom = 5;

            //console.log(params.data)

            var extent4326 = [extent[0][0], extent[0][1], extent[1][0], extent[1][1]];
            params.data.forEach(function (particle) {
                var windDirection = parseInt(particle.GRID_CODE);
                if (isNaN(windDirection) || windDirection < 0) return true;
                var windSpeed = parseFloat(particle.RASTERVALU);
                var zoomLevel = parseInt(particle.Level);
                var lon = particle.latLng[1];
                var lat = particle.latLng[0];

                var coord3857 = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
                if (zoomLevel >= zoom) {
                    if (ol.extent.containsCoordinate(extent4326, [lon, lat])) {
                        var pixel = map.getPixelFromCoordinate(coord3857);
                        var x = pixel[0];
                        var y = pixel[1];

                        if (layerOptions.drawtype == "wind") {
                            DT_Windbar.drawWind(g, y, x, windDirection, windSpeed, { map: null, isLatlng: false });
                        }
                        else {
                            DT_LineArrow.drawArrow(g, y, x, windDirection, windSpeed, { map: null, isLatlng: false });
                        }
                    }
                }
            });

            g.stroke();
        }

        var clearDraw = function clearDraw() {
            g.clearRect(0, 0, canvas.width, canvas.height);
        };

        var updateData = function updateData(data, bounds, width, height, extent) {
            delete params.data;
            params.data = data;
            if (extent) draw(bounds, width, height, extent);
        };

        var updateParams = function updateParams(options) {
            var i;
            for (i in options) {
                params[i] = options[i];
            }
        };

        var windbar = {
            params: params,
            draw: draw,
            clearDraw: clearDraw,
            update: updateData,
            updateParams: updateParams
        };

        return windbar;
    };

    var classCallCheck = function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    };

    var createCanvas = function createCanvas(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };

    var WindbarLayer = function () {
        function WindbarLayer(data) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            classCallCheck(this, WindbarLayer);

            this.$options = options;

            this.$canvas = null;

            this.$data = data;

            this._timer = null;

            this.layer_ = null;
        }

        WindbarLayer.prototype.getData = function getData() {
            return this.$data;
        };

        WindbarLayer.prototype.setData = function setData(data) {
            this.$data = data;
            delete this.$Windbar.params.data;
            this.$Windbar.params.data = data;
            this.getCanvasLayer();
            return this;
        };

        WindbarLayer.prototype.render = function render(canvas) {
            var _this = this;

            if (canvas && !this.$Windbar) {
                if (this._timer) window.clearTimeout(this._timer);
                //this._timer = window.setTimeout(function () {
                _this.$Windbar = new Windbar({
                    canvas: canvas,
                    _windbarLayer: _this,
                    data: _this.getData(),
                    onDraw: function onDraw() { }
                });
                var extent = _this.getExtent();
                _this.$Windbar.draw(extent[0], extent[1], extent[2], extent[3]);
                //}, 750);
            } else if (canvas && this.$Windbar) {
                var extent = this.getExtent();
                //console.log(extent)
                this.$Windbar.draw(extent[0], extent[1], extent[2], extent[3]);
            }
            return this;
        };

        WindbarLayer.prototype.getCanvasLayer = function getCanvasLayer() {
            if (!this.$canvas && !this.layer_) {
                var extent = this.getMapExtent();
                this.layer_ = new ol.layer.Image({
                    layerName: this.$options.layerName,
                    minResolution: this.$options.minResolution,
                    maxResolution: this.$options.maxResolution,
                    zIndex: this.$options.zIndex,
                    extent: extent,
                    source: new ol.source.ImageCanvas({
                        canvasFunction: this.canvasFunction.bind(this),
                        projection: this.$options.hasOwnProperty('projection') ? this.$options.projection : 'EPSG:3857',
                        ratio: this.$options.hasOwnProperty('ratio') ? this.$options.ratio : 1.5
                    })
                });
                this.$Map.addLayer(this.layer_);
                this.$Map.un('precompose', this.reRender, this);
                this.$Map.on('precompose', this.reRender, this);
            }
        };

        WindbarLayer.prototype.reRender = function reRender() {
            if (!this.layer_) return;
            var extent = this.getMapExtent();
            this.layer_.setExtent(extent);
        };

        WindbarLayer.prototype.canvasFunction = function canvasFunction(extent, resolution, pixelRatio, size, projection) {
            if (!this.$canvas) {
                var canvas = createCanvas(size[0], size[1]);
                this.$canvas = canvas;
            }
            this.render(this.$canvas);
            return this.$canvas;
        };

        WindbarLayer.prototype.getExtent = function getExtent() {
            var size = this.$Map.getSize();
            var _extent = this.$Map.getView().calculateExtent(size);
            var extent = ol.proj.transformExtent(_extent, 'EPSG:3857', 'EPSG:4326');
            return [[[0, 0], [size[0], size[1]]], size[0], size[1], [[extent[0], extent[1]], [extent[2], extent[3]]]];
        };

        WindbarLayer.prototype.getMapExtent = function getMapExtent() {
            var size = this.$Map.getSize();
            var extent = this.$Map.getView().calculateExtent(size);
            return extent;
        };

        WindbarLayer.prototype.appendTo = function appendTo(map) {
            if (map && map instanceof ol.Map) {
                this.$Map = map;
                this.getCanvasLayer();
            } else {
                throw new Error('not map object');
            }
        };

        WindbarLayer.prototype._clearWind = function _clearWind() {
            if (this._timer) window.clearTimeout(this._timer);
            if (this.$Windbar) this.$Windbar.clearDraw();
            this.$data = null;
            this.$Windbar.params.data = null;
        };

        WindbarLayer.prototype._updateParams = function _updateParams(params) {
            if (!this.$Windbar) return;
            this.$Windbar.updateParams(params);
        };
        WindbarLayer.prototype._update = function _updateParams(params) {
            if (!this.$Windbar) return;
            this.$Windbar.updateParams(params);
            this.render(this.$canvas);
        };

        WindbarLayer.prototype.onMoveStart = function onMoveStart() {
            if (!this.$Windbar) return;
            this.$Windbar.draw();
        };

        WindbarLayer.prototype.onMoveEnd = function onMoveEnd() {
            if (!this.$Windbar) return;
            this.$Windbar.draw();
        };

        WindbarLayer.prototype.onEvents = function onEvents() {
            var map = this.$Map;
            map.on('change:size', this.reRender, this);
            //map.on('movestart', this.onMoveStart, this);
            map.on('moveend', this.onMoveEnd, this);
        };

        WindbarLayer.prototype.unEvents = function unEvents() {
            var map = this.$Map;
            map.un('change:size', this.reRender, this);
            //map.un('movestart', this.onMoveStart, this);
            map.un('moveend', this.onMoveEnd, this);
        };

        return WindbarLayer;
    }();

    return WindbarLayer;

})));