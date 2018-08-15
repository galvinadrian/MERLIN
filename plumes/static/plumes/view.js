// javascript to control the view interface and establish various visual elements 

// Class object representing a given view. The view is the basic building block for 
// the visual interface, views host apps and load data which is displayed by the app.
// the view properties are controlled by the sidebar. 
class View { 
    constructor(view,index) { 
        // the view object must be passed a DOM object on creation, thus actual 
        // creation of the view element is not the responsibilty of the view class 
        // the view class merely attaches functionality to an already existing object
        this.view = view; // DOM object 
        this.$view = $(view); // Jquery object 

        // get the width and height of the view
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        // the current visual app being displayed on the view 
        this.app = null; 

        // the data currently loaded in the view 
        this.data = null;
        this.data_loaded = false; // boolean indicator telling whether data is loaded
        
        // index to uniquely reference this view
        this.index = index;
    }

    // registers an app to this view
    registerApp(app) { 
        // if we already have an app then we need to unmount it 
        if (this.app) { 
            this.app.unmount(); 
        }

        // mount the new app 
        app.mount(this);
        this.app = app;  
    }

    // remove current app from this view 
    removeApp() { 
        if (!this.app) { 
            return; 
        }

        this.app.unmount(); 
        this.app = null; 
    }

    // renders the mounted app onto the view 
    loadApp(show) { 
        if (!this.data_loaded) { 
            alert('No data loaded'); 
            return;
        }

        if (show) this.app.show(); 
    }

    // hides the app from the view
    unloadApp() { 
        this.app.hide(); 
    }

    // load data from the database into the view context
    loadData(bset,rset) { 
        // need to build the query string as follows 
        //[b1,b2,...eb,r1,r2,...er,maxh,minh,maxf,minf,st,et]
        //time format = year-month-day

        let maxfrp = $('#max-frp').val(),
            minfrp = $('#min-frp').val(), 
            maxph = $('#max-ph').val(), 
            minph = $('#min-ph').val(), 
            st = $('#start-date').val(),
            et = $('#end-date').val();

        let qstr = ''  

        bset.forEach(function(biome) { 
            qstr += biome + ','
        })

        qstr += 'eb,'; 

        rset.forEach(function(region) { 
            qstr += region + ','
        })

        qstr += 'er,'; 
        qstr += maxph + ',';
        qstr += minph + ',';
        qstr += maxfrp + ','; 
        qstr += minfrp + ',';
        qstr += st + ',';
        qstr += et;

        // alert(qstr); 

        let url = 'http://127.0.0.1:8000/query/?q=' + qstr;
        let self = this; 
        $.ajax({ 
            url : url, 
            type : 'GET', 
            success : (data) => {
                self.data = data;

                if (self.app) { 
                    self.app.view_data = data; 
                }

                $('#quantity').html(data.length); 
                
                // alert('Loaded ' + data.length + ' plumes');
                if (!self.data_loaded) {
                    $('#loaded').css('color','green'); 
                    $('#loaded').html('true');
                    // this.loadApp(false);
                    self.data_loaded = true; 
                } else { 
                    self.data_loaded = true;
                    this.loadApp(true); 
                }
                

                 
            }, 
            error : () => { 
                alert('there was an error'); 
            }
        })
    }

    unloadData() { 
        this.data = null; 
        this.data_loaded = false; 
    }
}

// bas class for all applications 
class App { 
    constructor() { 
        // start the object with view width
        this.view_width = 0; 
        this.view_height = 0; 
        this.view_data = null; 

        this.bgc = 'rgb(255,255,255)';

        // these need to be set by a specific app constructor
        this.stage = null; 
        this.$stage = null; 

        // whether or not this app is attached to a view 
        this.mounted = false; 
    }

    // mount the app to a view 
    mount(view) { 
        // if (this.mounted) {
        //     throw "App is already mounted"
        // }
        this.view_width = view.width; 
        this.view_height = view.height; 
        this.view_data = view.data; 
        this.mounted = true; 

        // put this apps stage on the view
        view.$view.append(this.$stage); 
    }

    // unmount the app from a view 
    unmount() { 
        if (!this.mounted) {
            throw "App is not mounted"
        }
        this.view_width = 0; 
        this.view_height = 0; 
        this.view_data = {}; 
        this.mounted = false; 

        this.$stage.remove(); 
    }

    show() { 
        alert('"show" error : app not fully implemented'); 
    }

    hide() { 
        alert('"hide" error : app not fully implemented')
    }   
}

// Map visual application 
class MapD3 extends App{ 
    constructor() {
        super(); 

        // establish the context for the map 
        this.stage = d3.select('.view')
        this.$stage = null // do not use the Jquery object for this app 

        this.svg = null
    }

    show() { 
        let self = this, 
            width = parseInt(this.view_width), 
            height = parseInt(this.view_height); 

        // attach an svg 
        this.svg = this.stage.append('svg')
            .attr('class','map')
            .attr('width',width)
            .attr('height',height);

        let cvs = null, 
            ctx = null; 
        
        let canvas = this.svg.append(function () { 
            cvs = document.createElement('canvas');
            ctx = cvs.getContext('2d'); 
            return cvs; 
            })
            .attr('class','map')
            .attr('width',width)
            .attr('height',height);

        alert(ctx);

        // attach a background to the map to change color
        this.svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#ccc");

        // append an element for the land
        this.land = this.svg.append('g'); 

        // create zoom behavior
        const zoom = d3.zoom()
            .on('zoom', () => {
                self.land.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
                self.land.attr('transform', d3.event.transform);
            })
            .scaleExtent([1,Infinity])
            .translateExtent([[0,0],[width,height]]);

        // attacch zoom behavior
        this.svg.call(zoom)

        // create projection 
        this.projection = d3.geoEquirectangular()
            .fitSize([width,height],geojson);

        this.geoPath = d3.geoPath().projection(this.projection); 

        this.land.selectAll('path')
            .data(geojson.features)
            .enter()
            .append('path')
            .attr('fill', '#fff')
            .attr('d', this.geoPath);


        // let ah = this.svg.selectAll('circle')
        //     .data(this.view_data)
        //     .enter()
        //     .append('circle')
        //     .attr('r',2)
        //     .attr('fill','red')
        //     .attr('transform',function(d) {
        //         let proj = self.projection; 
        //         let coord = proj([d.p_src_long,d.p_src_lat]);
        //         // console.log(coord); 
        //         return 'translate(' + coord + ')'; 
        //     });

        this.view_data.forEach(function(plume) { 
            ctx.fillStyle = 'rgb(123,12,123)';
            ctx.beginPath(); 
            ctx.arc(0, 0, 5, 0, 2 * Math.PI);
            ctx.fill();
        })


        

        // this.$stage.css('background-color',this.bgc); 
    }

    hide() { 
        if (this.svg) { 
            alert('remove');
            this.svg.remove(); 
        }
        
    }

}


// Map visual application 
class Plot extends App{ 
    constructor() {
        super(); 

        // establish the context for the map 
        this.stage = document.createElement('div'); // DOM object 
        this.$stage = $(this.stage); // jquery object 
        this.$stage.attr('id','chart'); // assign it an id so we can handle 

        this.data = []; 
        this.layout = {};
        this.conf =  { 
            displaylogo : false, 
            showLink : false, 
            modeBarButtonsToRemove : ['toImage','editInChartStudio']
        }

        this.bgc = 'rgb(255,255,255)';
    }

    show() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);
    }

    hide() { 
        this.$stage.css('width',0); 
        this.$stage.css('height',0);
    }

    setData() { 
        alert('Plot not fully implemented');
    }
}

class Pie extends Plot { 
    constructor() { 
        super(); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let value = Array.apply(null, Array(17)).map(Number.prototype.valueOf,0);

        // alert(value);

        this.view_data.forEach(function(plume,i) { 

            value[plume.p_biome_id]++;   
        }); 

        let v = []; 
        let b = [];
        let c = []; 

        value.forEach(function(p,i) { 
            if (value[i] == 0) {
                return
            }

            v.push(value[i]); 
            b.push(biomebins[i]);
            c.push(biomecolors[i]);
        })

        trace1 = {
            type: 'pie',
            values: v,
            labels: b,
            marker : {
                // color : 'rgb(246,149,149)', 
                colors : c,
            }
        };

    
        layout = { 
            height: this.view_height, 
            width: this.view_width, 
        }
        this.data = [trace1];
        this.layout = layout; 
    }
}

class ScatterPlot extends Plot { 
    constructor() { 
        super(); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let x =[]; 
        let y =[]; 

        let colors = []; 

        this.view_data.forEach(function(plume,i) { 

            // let opt = plume.p_avg_opt_depth; 
            // let ab = plume.p_avg_ss_albedo; 
            // if (!opt || !ab) { 
            //     return; 
            // }
            // x.push(ab[3]);
            // let runner = opt[3];
            let runner = 0; 
            let ratter = 0;
            // opt.forEach(function(n) {
            //     // alert(n); 
            //     runner += n;
            // })

            // ab.forEach(function(n) {
            //     // alert(n); 
            //     ratter += n;
            // })
            // runner = Math.sqrt(runner); 
            // console.log(runner);
            x.push(plume.p_total_frp);    
            y.push(plume.p_max_ht); 
            colors.push(biomecolors[plume.p_biome_id])   
        }); 

        trace1 = {
            type: 'scatter',
            x: x,
            y: y,
            mode: 'markers',
            marker : {
                // color : 'rgb(246,149,149)', 
                color : colors,
            }
        };

    
        layout = { 
            title: 'Ht vs FRP',
            // showlegend: false,
            // hovermode: 'closest',
            xaxis : {
                title : 'FRP', 
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals, 
            },
            yaxis : { 
                title : 'Max Ht',
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals,  
            },
        };
        this.data = [trace1];
        this.layout = layout; 
    }
}

let months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

class ScatterPlot2 extends Plot { 
    constructor() { 
        super(); 
    }

    setData() { 
        let trace1 = {}; 
        let trace2 = {}; 
        let layout = {}; 
        let x = Array.apply(null, Array(12)).map(Number.prototype.valueOf,0);
        let y = Array.apply(null, Array(5000)).map(Number.prototype.valueOf,0);
        let x1 = x; 
        let y1 = y; 
        // let colors = []; 

        this.view_data.forEach(function(plume,i) { 
            let month = plume.p_date.split('-')[1];
            if (plume.p_avg_ss_albedo == null) {
                return; 
            }
            let frp = plume.p_avg_ss_albedo[1]*50; 
            frp = Math.round(frp); 
            x[frp] += 1; 
            // let ht = Math.round(plume.p_med_ht); 
            // console.log(ht); 
            // if (plume.p_biome_id == 0) {
            //     x[ht] += 1;
            // } else if (plume.p_biome_id == 4) { 
            //     y[ht] += 1; 
            // }
            // x.push(plume.p_total_frp); 
            // y.push(plume.p_max_ht);    
            // colors.push(biomecolors[plume.p_biome_id])   
        }); 

        // let x = [];
        // for (var i = 0; i < 12; i ++) {
        //     x[i] = Math.random();
        // }

        trace1 = {
            y: x,
            // x: months, 
            type: 'bar',
            // autobinx: false, 
            // xbins : { 
            //     start : 0, 
            //     end : 11, 
            //     size: 1,
            // }

        };
        // var data = [trace];
        // Plotly.newPlot('myDiv', data);

        // alert(x); 
        // alert(y); 

        // trace1 = {
        //     type: 'scatter',
        //     x: x,
        //     y: y,
        //     mode: 'markers',
        //     marker : {
        //         // color : 'rgb(246,149,149)', 
        //         color : colors,
        //     }
        // };

    
        // layout = { 
        //     title: 'Max Plume Height vs Biome',
        //     showlegend: false,
        //     hovermode: 'closest',
        //     xaxis : {
        //         title : 'Total FRP', 
        //         // tickmode : "array",   
        //         // ticktext : biomebins, 
        //         // tickvals : biomevals, 
        //     },
        //     yaxis : { 
        //         title : 'Max Plume Height (m)', 
        //     },
        //     sliders: [{
        //         // pad: {t: 30},
        //         currentvalue: {
        //           xanchor: 'right',
        //           prefix: 'color: ',
        //           font: {
        //             color: '#888',
        //             size: 20
        //           }
        //         }
        //     }]
        // }

        // trace1 = { 
        //     x: x, 
        //     // x : x1,
        //     type: 'histogram', 
        //     color: 'red',
        //     xbins: { 
        //         end: 5000, 
        //         size: 0.06, 
        //         start: -3.2
            
        //       },

        //     // autobinx : false,
        // }

        // trace2 = {
        //     x: y, 
        //     // x: x1, 
        //     type: 'histogram',
        //     color: 'blue',

        // }

        layout = { 
            title : 'Total Fire Radiative Power by Month', 
            bargap: 0.05, 
            // bargroupgap: 1, 
            // barmode: 'stack'
        }
        this.data = [trace1];
        this.layout = layout; 
    }
}

class ParallelPlot extends Plot { 
    constructor() { 
        super(); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let c1 = [];
        let c2 = []; 
        let c3 = [];
        let c4 = []; 
        let colors = []; 

        this.view_data.forEach(function(plume,i) { 

            c1.push(plume.p_max_ht); 
            c2.push(plume.p_total_frp); 
            c3.push(plume.p_perimeter); 
            c4.push(plume.p_max_angstrom);   
            colors.push(biomecolors[plume.p_biome_id]); 
        }); 

        trace1 = {
            type: 'parcoords',
            line: {
                color: biomecolors[10],
                // color: colors,  
                opacity: 0.5,
            },
            
            dimensions: [{
            //   range: [1, 5],
            //   constraintrange: [1, 2],
              label: 'Total FRP',
              values: c2
            }, {    
            //   range: [1,5],
              label: 'Plume Height',
              values: c1,
            //   tickvals: [1.5,3,4.5]
            }, {
            //   range: [1, 5],
              label: 'Plume Perimeter',
              values: c3,
            //   tickvals: [1,2,4,5],
            //   ticktext: ['text 1','text 2','text 4','text 5']
            }, {
            //   range: [1, 5],
              label: 'Max Angstrom',
              values: c4
            }]
          };

        layout = { 
            title: 'Parallel Coordinates',
        }

        this.data = [trace1];
        this.layout = layout; 
    }
}


class Map extends Plot { 
    constructor() { 
        super(); 
    }

    setData() { 

        // let data_instance = []; 
        let latitudes = []; 
        let longitudes = []; 
        let trace1 = {}; 
        let layout = {}; 
        let colors =[]; 

        this.view_data.forEach(function(plume,i) { 
            latitudes.push(plume.p_src_lat); 
            longitudes.push(plume.p_src_long);   
            colors.push(biomecolors[plume.p_biome_id]);  
        }); 

        trace1 = {
            type: 'scattergeo',
            locationmode: 'ISO-3',
            lat: latitudes,
            lon: longitudes,
            marker: {
                size: 3,
                // color: 'rgb(246,149,149)',
                // opacity: 0.05, 
                color: colors,
            }
        };

        layout = { 
            // title: 'Map',
            showlegend: false,
            geo: {
                scope: 'world',
                showocean: true, 
                oceancolor: 'rgb(242,242,242)',
                showcoastlines: false,
                coastlinewidth: 0, 
                coastlinecolor: 'rgb(255,255,255)',
                showland: false,
                landcolor: 'rgb(255, 255, 255)',
                subunitwidth: 1,
                countrywidth: 1,
                subunitcolor: 'rgb(255,255,255)',
                countrycolor: 'rgb(255,255,255)'
            },
        }

        this.data = [trace1];
        this.layout = layout; 

        // let s = document.getElementById('chart'); 

        // this.stage.on('plotly_selected', function(eventdata) { 
        //     latitudes = []; 
        //     longitudes = []; 
        //     console.log(eventData.points); 
        //     eventData.points.forEach(function(pt) {
                
        //         colors[pt.pointNumber] = color1;
        //       });
        //     Plotly.newPlot(this.stage,this.data,this.layout,this.conf);
        // }); 
    }
}