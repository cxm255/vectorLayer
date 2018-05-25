/*
 * author: newcookie <453546488@qq.com>
 * DT_*[DT_Windbar] v0.0.1
 * time: 2018-01-23
 * LICENSE: MIT
 * (c) 2017-2118
 */
var DT_Windbar = (function (windbar) {
    var _map;
    var barLength, fourLength, twoLength, triinterval, triLength, winterval;
    var windSpeedArray = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
    var α = 30; //风三角角度
    var size = 0.8; //大小
    var color = "rgba(0,0,0, 0.8)"; //颜色

    //初始化(百分比大小,颜色,风三角角度)
    function init(newsize, newcolor, newTriAbgle) {
        size = newsize || size;
        color = newcolor || color;
        α = newTriAbgle || α;

        var wsize = size * 24;
        var wind = size * 10;
        setParm(wsize, wind, α);
    }

    //风杆参数-杆长度/4m风长度/风三角角度
    function setParm(l, w, α) {
        barLength = l;
        fourLength = w;
        twoLength = fourLength * 0.55;
        triinterval = w * Math.sin(2 * Math.PI / 360 * α);
        winterval = triinterval * 0.5;
        triLength = w * Math.cos(2 * Math.PI / 360 * α);
        //console.log(barLength + "," + fourLength + "," + twoLength + "," + triinterval + "," + triLength + "," + winterval)
    };


    function drawWind(ctx, lat, lon, angle, speed, latlngType) {
        _map = _map || (latlngType ? latlngType.map : null);
        var w = splitSpeed(speed);

        angle = angle - 90; //箭头初始化方向设定

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();

        var point = { y: lat, x: lon }
        if (_map && latlngType && latlngType.isLatlng)
            point = _map.latLngToContainerPoint([lat, lon]);

        ctx.moveTo(point.x, point.y);
        var end1 = setWindBar(point.x, point.y, angle, 0);
        ctx.lineTo(end1[0], end1[1]);
        var wLength = w.length;
        for (var wi = 0; wi < wLength; wi++) {
            if (w[wi] == 20) {
                var st = setWindBar(point.x, point.y, angle, triinterval * wi);
                ctx.moveTo(st[0], st[1]);
                var end2 = setWindtri(st[0], st[1], angle);
                ctx.lineTo(end2[0], end2[1]);
                ctx.lineTo(end2[2], end2[3]);
                //ctx.closePath();
                //ctx.fill();
            }
            else {
                var st;

                if (w[0] == 20) {
                    st = setWindBar(point.x, point.y, angle, (winterval * wi + triinterval))
                }
                else {
                    st = setWindBar(point.x, point.y, angle, winterval * wi);
                }

                ctx.moveTo(st[0], st[1]);

                var end2;
                if (w[wi] == 4)
                    end2 = setWind4m(st[0], st[1], angle);
                else if (w[wi] == 2)
                    end2 = setWind2m(st[0], st[1], angle);
                ctx.lineTo(end2[0], end2[1]);
            }
        }
        ctx.stroke();
    }

    function setWindBar(x, y, angle, interval) {
        var rad = 2 * Math.PI / 360 * angle;
        var ex = Math.cos(rad) * (barLength - interval) + x;
        var ey = Math.sin(rad) * (barLength - interval) + y;
        return ([ex, ey])
    }

    function setWind4m(x, y, angle) {
        var rad = 2 * Math.PI / 360 * (angle + (90 - α));
        var ex = Math.cos(rad) * fourLength + x;
        var ey = Math.sin(rad) * fourLength + y;
        return ([ex, ey])
    }

    function setWind2m(x, y, angle) {
        var rad = 2 * Math.PI / 360 * (angle + (90 - α));
        var ex = Math.cos(rad) * twoLength + x;
        var ey = Math.sin(rad) * twoLength + y;
        return ([ex, ey])
    }

    function setWindtri(x, y, angle) {
        var rad1 = 2 * Math.PI / 360 * (angle + 90);
        var rad2 = 2 * Math.PI / 360 * (angle + 90 + α + 180 - α * 2);
        var ex1 = Math.cos(rad1) * triLength + x;
        var ey1 = Math.sin(rad1) * triLength + y;
        var ex2 = Math.cos(rad2) * fourLength + ex1;
        var ey2 = Math.sin(rad2) * fourLength + ey1;
        return ([ex1, ey1, ex2, ey2]);
    }

    function splitSpeed(speed) {
        var wind = [];
        var a = speed % 4;
        var b = speed % 20;
        if (speed >= windSpeedArray[windSpeedArray.length - 1])
            speed = windSpeedArray[windSpeedArray.length - 1];
        if (speed <= 2)
            speed = 2;

        if (b == 0) {
            for (var i = 1; i <= speed / 20; i++) {
                wind.push(20);
            }
        } else {
            if (speed < 20) {
                if (a == 0) {
                    for (var i = 1; i <= speed / 4; i++) {
                        wind.push(4);
                    }
                } else {
                    for (var i = 1; i <= speed / 4; i++) {
                        wind.push(4);
                    };
                    wind.push(2);
                }
            } else if (speed < 40 && speed > 20) {
                for (var i = 1; i <= speed / 20; i++) {
                    wind.push(20);
                };
                var aa = (speed - 20) % 4;
                if (aa == 0) {
                    for (var i = 1; i <= (speed - 20) / 4; i++) {
                        wind.push(4);
                    }
                } else {
                    for (var i = 1; i <= (speed - 20) / 4; i++) {
                        wind.push(4);
                    };
                    wind.push(2);
                }
            }
        }

        return wind;
    }

    //判断是否在屏幕范围内
    function isInBounds(lat, lng) {
        var bound = _map.getBounds();
        if (lat > bound._northEast.lat || lat < bound._southWest.lat || lng > bound._northEast.lng || lng < bound._southWest.lng) {
            return false;
        } else {
            return true;
        };
    }


    function drawArrow(ctx, lat, lon, angle, speed, latlngType) {
        _map = _map || (latlngType ? latlngType.map : null);
        var w = [speed, speed];

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();

        var point = { y: lat, x: lon }
        if (_map && latlngType && latlngType.isLatlng)
            point = _map.latLngToContainerPoint([lat, lon]);

        ctx.moveTo(point.x, point.y);
        var end1 = setArrowPoint(point.x, point.y, angle, 0);
        ctx.lineTo(end1[0], end1[1]);
        var wi = 0;
        st = setArrowPoint(point.x, point.y, angle, fourLength * wi);


        ctx.moveTo(st[0], st[1]);
        var end2 = setArrow2m(point.x, point.y, angle);
        ctx.lineTo(end2[0], end2[1]);

        ctx.moveTo(st[0], st[1]);
        var end2 = setArrow2m(point.x, point.y, -angle);
        ctx.lineTo(end2[0], end2[1]);

        ctx.stroke();
    }

    function setArrowPoint(x, y, angle, interval) {
        var rad = 2 * Math.PI / 360 * angle;
        var ex = Math.cos(rad) * (barLength - interval) + x;
        var ey = Math.sin(rad) * (barLength - interval) + y;
        return ([ex, ey])
    }
    function setArrow2m(x, y, angle) {
        var rad = 2 * Math.PI / 360 * (angle + (90 - α));
        var ex = Math.cos(rad) * twoLength + x;
        var ey = Math.sin(rad) * twoLength + y;
        return ([ex, ey])
    }

    init();


    return {
        init: init,
        setParm: setParm,
        drawWind: drawWind,
        drawArrow: drawArrow
    }

})(DT_Windbar || {});


//polygonVertex存储模式：
//polygonVertex[0,1]=beginPoint;
//polygonVertex[2,3]=polygonVertex[triangle]右边坐标点
//polygonVertex[4,5]=三角形右边坐标
//polygonVertex[6,7]=三角形顶点坐标   stopPoint
//polygonVertex[8,9]=三角形左边坐标
//polygonVertex[10,11]=polygonVertex[triangle]左边坐标点

var DT_RotateArrow = (function (rotatearrow) {
    var beginPoint = {},
        stopPoint = {},
        polygonVertex = [],
        CONST = {
            edgeLen: 50,    //箭头边缘长度，调整箭头形状
            angle: 25   //箭头尾巴角度，调整箭头粗细
        };
    var _index = 0;
    //封装的作图对象
    var Plot = {

        angle: "",

        //在CONST中定义的edgeLen以及angle参数
        //短距离画箭头的时候会出现箭头头部过大，修改：
        dynArrowSize: function () {
            var x = stopPoint.x - beginPoint.x,
                y = stopPoint.y - beginPoint.y,
                length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            if (length < 250) {
                CONST.edgeLen = CONST.edgeLen / 2;
                CONST.angle = CONST.angle / 2;
            }
            else if (length < 500) {
                CONST.edgeLen = CONST.edgeLen * length / 500;
                CONST.angle = CONST.angle * length / 500;
            }
            // console.log(length);
        },

        //getRadian 返回以起点与X轴之间的夹角角度值
        getRadian: function (beginPoint, stopPoint) {
            Plot.angle = Math.atan2(stopPoint.y - beginPoint.y, stopPoint.x - beginPoint.x) / Math.PI * 180;
            //console.log(Plot.angle);
            //console.log(CONST);
            //paraDef(50, 25);
            //Plot.dynArrowSize();
        },

        ///获得箭头底边两个点
        arrowCoord: function (beginPoint, stopPoint) {
            polygonVertex[0] = beginPoint.x;
            polygonVertex[1] = beginPoint.y;
            polygonVertex[6] = stopPoint.x;
            polygonVertex[7] = stopPoint.y;
            Plot.getRadian(beginPoint, stopPoint);
            polygonVertex[8] = stopPoint.x - CONST.edgeLen * Math.cos(Math.PI / 180 * (Plot.angle + CONST.angle));
            polygonVertex[9] = stopPoint.y - CONST.edgeLen * Math.sin(Math.PI / 180 * (Plot.angle + CONST.angle));
            polygonVertex[4] = stopPoint.x - CONST.edgeLen * Math.cos(Math.PI / 180 * (Plot.angle - CONST.angle));
            polygonVertex[5] = stopPoint.y - CONST.edgeLen * Math.sin(Math.PI / 180 * (Plot.angle - CONST.angle));
        },

        //获取另两个底边侧面点
        sideCoord: function () {
            var midpoint = {};
            // midpoint.x = polygonVertex[6] - (CONST.edgeLen * Math.cos(Plot.angle * Math.PI / 180));
            // midpoint.y = polygonVertex[7] - (CONST.edgeLen * Math.sin(Plot.angle * Math.PI / 180));
            midpoint.x = (polygonVertex[4] + polygonVertex[8]) / 2;
            midpoint.y = (polygonVertex[5] + polygonVertex[9]) / 2;
            polygonVertex[2] = (polygonVertex[4] + midpoint.x) / 2;
            polygonVertex[3] = (polygonVertex[5] + midpoint.y) / 2;
            polygonVertex[10] = (polygonVertex[8] + midpoint.x) / 2;
            polygonVertex[11] = (polygonVertex[9] + midpoint.y) / 2;
        },

        //设置箭头颜色
        setArrowColor: function (ctx, imageOverlayType, speed) {
            ctx.fillStyle = "rgba(51,51,51, 1.0)";
            if (imageOverlayType == "SeaWater") {
                if (speed >= 2.8)
                    ctx.fillStyle = "rgba(255,0,0, 1.0)";
                else if (speed >= 2.6 && speed < 2.8)
                    ctx.fillStyle = "rgba(255,76,0, 1.0)";
                else if (speed >= 2.4 && speed < 2.6)
                    ctx.fillStyle = "rgba(255,120,0, 1.0)";
                else if (speed >= 2.2 && speed < 2.4)
                    ctx.fillStyle = "rgba(255,167,0, 1.0)";
                else if (speed >= 2.0 && speed < 2.2)
                    ctx.fillStyle = "rgba(255,215,0, 1.0)";
                else if (speed >= 1.8 && speed < 2.0)
                    ctx.fillStyle = "rgba(255,255,0, 1.0)";
                else if (speed >= 1.6 && speed < 1.8)
                    ctx.fillStyle = "rgba(231,255,74, 1.0)";
                else if (speed >= 1.4 && speed < 1.6)
                    ctx.fillStyle = "rgba(199,255,122, 1.0)";
                else if (speed >= 1.2 && speed < 1.4)
                    ctx.fillStyle = "rgba(165,255,165, 1.0)";
                else if (speed >= 1.0 && speed < 1.2)
                    ctx.fillStyle = "rgba(114,255,215, 1.0)";
                else if (speed >= 0.8 && speed < 1.0)
                    ctx.fillStyle = "rgba(0,255,255, 1.0)";
                else if (speed >= 0.6 && speed < 0.8)
                    ctx.fillStyle = "rgba(48,207,255, 1.0)";
                else if (speed >= 0.4 && speed < 0.6)
                    ctx.fillStyle = "rgba(56,159,255, 1.0)";
                else if (speed >= 0.2 && speed < 0.4)
                    ctx.fillStyle = "rgba(56,108,255, 1.0)";
                else if (speed >= 0 && speed < 0.2)
                    ctx.fillStyle = "rgba(40,64,255, 1.0)";
                else//如果异常，应该是最高级别颜色，引起注意
                    ctx.fillStyle = "rgba(255,0,0, 1.0)";
            }
        },

        //画箭头
        drawArrow: function (ctx, imageOverlayType, speed) {
            //var ctx;
            //ctx = $(".drawArrow")[0].getContext('2d');

            //Plot.setArrowColor(ctx, imageOverlayType, speed);
            ctx.fillStyle = "rgba(0,0,0, 0.8)";
            ctx.beginPath();
            ctx.moveTo(polygonVertex[0], polygonVertex[1]);
            ctx.lineTo(polygonVertex[2], polygonVertex[3]);
            ctx.lineTo(polygonVertex[4], polygonVertex[5]);
            ctx.lineTo(polygonVertex[6], polygonVertex[7]);
            ctx.lineTo(polygonVertex[8], polygonVertex[9]);
            ctx.lineTo(polygonVertex[10], polygonVertex[11]);
            // ctx.lineTo(polygonVertex[0], polygonVertex[1]);
            ctx.closePath();
            ctx.fill();
        }
    };

    ////记录起点beginPoint
    //$(".drawArrow").mousedown(function (e) {
    //    beginPoint.x = e.pageX;
    //    beginPoint.y = e.pageY;
    //    // alert(beginPoint.x+"+"+beginPoint.y);
    //});

    ////记录终点stopPoint，绘图
    //$(".drawArrow").mouseup(function (e) {
    //    stopPoint.x = e.pageX;
    //    stopPoint.y = e.pageY;
    //    // alert(stopPoint.x+"+"+stopPoint.y);
    //    Plot.arrowCoord(beginPoint, stopPoint);
    //    Plot.sideCoord();
    //    Plot.drawArrow();
    //});

    //自定义参数
    function paraDef(edgeLen, angle) {
        CONST.edgeLen = edgeLen;
        CONST.angle = angle;
    }

    function drawArrow(ctx, y, x, angle, speed, imageOverlayType) {
        beginPoint.x = x;
        beginPoint.y = y;
        angle = angle - 90;//箭头初始化方向设定
        var otherPoint = setArrowOtherPoint(x, y, angle, 0);
        stopPoint.x = otherPoint.x;
        stopPoint.y = otherPoint.y;
        Plot.arrowCoord(beginPoint, stopPoint);
        Plot.sideCoord();
        Plot.drawArrow(ctx, imageOverlayType, speed);
    }

    function setArrowOtherPoint(x, y, angle, interval) {
        var rad = 2 * Math.PI / 360 * angle;
        var ex = Math.cos(rad) * (20 - interval) + x;
        var ey = Math.sin(rad) * (20 - interval) + y;
        return { x: ex, y: ey }
    }

    // $(".para-def").click(function() {
    //     var edgeLen,
    //         angle;
    //     edgeLen = parseInt($(".edge-len").val());
    //     angle = parseInt($(".angle").val());
    //     paraDef(edgeLen, angle);
    // });

    //各种凹凸箭头
    //paraDef(5, 35);//→细箭头 // paraDef(8,50);//→粗箭头paraDef(6, 40);//→中箭头
    //paraDef(110, 1);//镊子 //paraDef(-50, 10);//镊子
    //paraDef(-50, 30); //铁塔//paraDef(20, -150); //火箭
    //paraDef(1, 110);//蝌蚪，洋流
    //paraDef(5, 110);paraDef(20, 110);//锥子，三角架

    //paraDef(15, 15);//>
    paraDef(25, 15);//>箭头

    return {
        paraDef: paraDef,
        drawArrow: drawArrow
    }

})(DT_RotateArrow || {});



var DT_LineArrow = (function (linearrow) {
    var beginPoint = {},
        stopPoint = {},
        polygonVertex = [],
        CONST = {
            edgeLen: 6,    //箭头方向长度
            angle: 25,    //箭头方向角度
            fillStyle: 'rgba(0,0,0, 0.8)',  //箭头颜色
            strokeStyle: 'rgba(0,0,0, 0.8)'
        };
    var _index = 0;
    //封装的作图对象
    var Plot = {

        angle: "",

        //getRadian 返回以起点与X轴之间的夹角角度值
        getRadian: function (beginPoint, stopPoint) {
            Plot.angle = Math.atan2(stopPoint.y - beginPoint.y, stopPoint.x - beginPoint.x) / Math.PI * 180;
        },

        ///获得箭头点
        arrowCoord: function (beginPoint, stopPoint) {
            polygonVertex[0] = beginPoint.x;
            polygonVertex[1] = beginPoint.y;
            polygonVertex[6] = stopPoint.x;
            polygonVertex[7] = stopPoint.y;
            Plot.getRadian(beginPoint, stopPoint);
            polygonVertex[8] = stopPoint.x - CONST.edgeLen * Math.cos(Math.PI / 180 * (Plot.angle + CONST.angle));
            polygonVertex[9] = stopPoint.y - CONST.edgeLen * Math.sin(Math.PI / 180 * (Plot.angle + CONST.angle));
            polygonVertex[4] = stopPoint.x - CONST.edgeLen * Math.cos(Math.PI / 180 * (Plot.angle - CONST.angle));
            polygonVertex[5] = stopPoint.y - CONST.edgeLen * Math.sin(Math.PI / 180 * (Plot.angle - CONST.angle));
        },

        //绘制箭头方向
        drawArrowhead: function (ctx, x, y, radians) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(x, y);
            ctx.rotate(radians);
            ctx.moveTo(0, 0);
            ctx.lineTo(5, 20);
            ctx.lineTo(-5, 20);
            ctx.closePath();
            ctx.restore();
            ctx.fill();
        },

        //画箭头
        drawArrow: function (ctx, speed) {
            ctx.fillStyle = CONST.fillStyle;
            ctx.strokeStyle = CONST.strokeStyle;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(polygonVertex[0], polygonVertex[1]);
            ctx.lineTo(polygonVertex[6], polygonVertex[7]);
            ctx.lineTo(polygonVertex[4], polygonVertex[5]);
            ctx.lineTo(polygonVertex[6], polygonVertex[7]);
            ctx.lineTo(polygonVertex[8], polygonVertex[9]);
            //ctx.closePath();
            //ctx.fill();
            ctx.stroke();
        }
    };
    //初始化
    function paraDef(options) {
        CONST.edgeLen = options.edgeLen;
        CONST.angle = options.angle;
        CONST.fillStyle = options.fillStyle;
        CONST.strokeStyle = options.strokeStyle;
    }

    function drawArrow(ctx, y, x, angle, speed, options) {
        beginPoint.x = x;
        beginPoint.y = y;
        angle = angle - 90; //箭头初始化方向设定
        var otherPoint = setArrowOtherPoint(x, y, angle, 0);
        stopPoint.x = otherPoint.x;
        stopPoint.y = otherPoint.y;

        Plot.arrowCoord(beginPoint, stopPoint);
        Plot.drawArrow(ctx, speed);
    }

    function setArrowOtherPoint(x, y, angle, interval) {
        var rad = 2 * Math.PI / 360 * angle;
        var ex = Math.cos(rad) * (20 - interval) + x;
        var ey = Math.sin(rad) * (20 - interval) + y;
        return { x: ex, y: ey }
    }

    return {
        paraDef: paraDef,
        drawArrow: drawArrow
    }

})(DT_LineArrow || {});