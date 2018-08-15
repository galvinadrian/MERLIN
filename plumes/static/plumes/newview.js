// javascript to control the view interface and establish various visual elements 
const event = new CustomEvent('data_load');
// const event = new CustomEvent('data_change');

// Class representing a data object 
class Data { 
    // when you construct the data object we retrieve a data query from 
    // the current filters and save that into the content of the object 
    constructor(biome_set,region_set,fill) { 
        this.max_frp = $('#max-frp').val();
        this.min_frp = $('#min-frp').val(); 
        this.max_plume_ht = $('#max-ph').val(); 
        this.min_plume_ht = $('#min-ph').val(); 
        this.start_date = $('#start-date').val();
        this.end_date = $('#end-date').val();

        this.biome_set = biome_set; 
        this.region_set = region_set; 

        this.biome_names = addedBiomesNames;
        this.region_names = addedRegionsNames;

        // these are the actual variables used by a view to interact with data
        this.content = []; 
        this.num_plumes = 0; 

        // create an event dispatcher 
        this.dispatcher = new EventTarget(); 

        // whether or not the data is ready 
        this.ready = false; 
        if (fill) this.get(); 
    }

    // load this data to the filter set 
    load() { 
        $('#max-frp').val(this.max_frp);
        $('#min-frp').val(this.min_frp); 
        $('#max-ph').val(this.max_plume_ht); 
        $('#min-ph').val(this.min_plume_ht); 
        $('#start-date').val(this.start_date);
        $('#end-date').val(this.end_date);

        addedBiomes.clear(); 
        addedRegions.clear();
        addedBiomesNames.clear();
        addedRegionsNames.clear();

        $('.multisel.0').empty();
        $('.multisel.1').empty();
        this.biome_names.forEach(function(name) {
            addedBiomes.add(name[1]);
            addedBiomesNames.add(name[0]); 
            $('.multisel.0').append(name[0]);
        })

        this.region_names.forEach(function(name) {
            addedRegions.add(name[1]);
            addedRegionsNames.add(name[0]); 
            $('.multisel.1').append(name[0]);
        })
    }

    // update this data object with the current filter set
    update(biome_set,region_set) { 
        this.ready = false; 
        this.max_frp = $('#max-frp').val();
        this.min_frp = $('#min-frp').val(); 
        this.max_plume_ht = $('#max-ph').val(); 
        this.min_plume_ht = $('#min-ph').val(); 
        this.start_date = $('#start-date').val();
        this.end_date = $('#end-date').val();

        this.biome_set = biome_set; 
        this.region_set = region_set; 
        this.region_names = addedRegionsNames;
        this.biome_names = addedBiomesNames;
        this.get(); 
    }

    // query the server with this specific data object 
    get() { 
        // need to build the query string as follows 
        //[b1,b2,...eb,r1,r2,...er,maxh,minh,maxf,minf,st,et]
        //time format = year-month-day

        let query_str = ''  

        this.biome_set.forEach(function(biome) { 
            query_str += biome + ','
        })

        // end biome tag
        query_str += 'eb,'; 

        this.region_set.forEach(function(region) { 
            query_str += region + ','
        })
        // end region tab
        query_str += 'er,'; 

        query_str += this.max_plume_ht + ',' + this.min_plume_ht + ',' 
                + this.max_frp + ',' + this.min_frp + ',' 
                + this.start_date + ',' + this.end_date;


        // console.log(query_str);
        let url = 'http://127.0.0.1:8000/query/?q=' + query_str;
        let self = this; 

        session.show_loading_icon();
        $.ajax({ 
            url : url, 
            type : 'GET', 
            success : (data) => {
                self.content = data;
                self.num_plumes = data.length;
                self.ready = true; 
                self.dispatcher.dispatchEvent(event);
                session.hide_loading_icon();
            }, 
            error : () => { 
                alert('there was an error'); 
            }
        })
    }

    // return the data of the data object
    data() {
        return this.content; 
    }

    // return the length of the data object 
    size() { 
        return this.num_plumes;
    }

    is_ready() { 
        return this.ready;
    }


}

// Class object representing a given view. The view is the basic building block for 
// the visual interface, views host apps and load data which is displayed by the app.
// the view properties are controlled by the sidebar. 
class View { 
    constructor(view,index,view_num) { 
        let self = this;
        // the view object must be passed a DOM object on creation, thus actual 
        // creation of the view element is not the responsibilty of the view class 
        // the view class merely attaches functionality to an already existing object
        this.view = view; 
        this.$view = $(this.view) // the DOM object that the view is on 
        this.$view.css('border-color',FILTER.COLORS[index]);

        // get the width and height of the view
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        // establish and attach the plate 
        this.plate = document.createElement('div'); 
        this.$plate = $(this.plate); 
        this.$plate.addClass('plate')
            .css('width',this.width)
            .css('height',parseInt(this.height) * 0.90);  

        this.toolbar = document.createElement('div'); 
        this.$toolbar = $(this.toolbar); 
        this.$toolbar.addClass('toolbar')
            .css('width',this.width)
            .css('height',parseInt(this.height) * 0.1);  

        

        let $select = $('<select class="view-filter"> \
            <option value="0" selected="selected">Filter 1</option> \
            <option value="1">Filter 2</option> \
            <option value="2">Filter 3</option> \
            <option value="3">Filter 4</option> \
            </select>').change(function() { 
            let val = $(this).val(); 
            let view = $(this).parent().parent();
            self.change_filter(val);

        })

        let $edit = null; 

        if (view_num == 0) { 
            $edit = $('<div class="view-edit active" data-value="' + view_num +'"> edit </div>')
                .click(function(event) {
                    if ($(event.target).hasClass('active')) { 
                        return; 
                    }
                    $('.view-edit.active').removeClass('active');
                    $(event.target).addClass('active');
                    session.selected_view = $(event.target).attr('data-value');
                })
        } else {
            $edit = $('<div class="view-edit" data-value="' + view_num +'"> edit </div>')
                .click(function(event) {
                    if ($(event.target).hasClass('active')) { 
                        return; 
                    }
                    $('.view-edit.active').removeClass('active');
                    $(event.target).addClass('active');
                    session.selected_view = $(event.target).attr('data-value');
                })
        }

        this.$toolbar.append($edit)
            .append($select);
        


        // the functional dimensions for an app 
        this.app_width = this.$plate.css('width'); 
        this.app_height = this.$plate.css('height');

        this.$view.append(this.toolbar);
        this.$view.append(this.plate);

        // the current visual app being displayed on the view 
        this.app = null; 
        this.app_loaded = false; 

        // the data currently loaded in the view 
        this.data = session.filters[index]; 
        this.event_listener = this.data.dispatcher; 

        // let self = this;
        this.event_listener.addEventListener('data_load', function () { 
            self.render();
        })
        
        // index to uniquely reference this view
        this.filter_index = index; 

        // // create a new listener for events 
        // this.event_listener = null; 
    }

    // mounts the new app onto the view 
    load_app(new_app) { 
        if (new_app.is_mounted()) { 
            return -1; 
        }

        if (this.app) { 
            this.app.unmount(); 
        }

        // establish new app and link it with the view
        new_app.mount(this); 
        this.app = new_app; 
        
        // the app has been loaded into the view
        this.app_loaded = true; 
        return 0; 
    }

    // hides the app from the view
    unload_app() { 
        // if there is no app loaded then we don't have anything to do 
        if (!this.app) { 
            return; 
        }

        this.app.hide(); 
        this.app.unmount();
        this.app = null; 
        this.app_loaded = false; 
    }

    // load data from the database into the view context
    load_data(data) { 

        this.data = data; 
        this.event_listener = this.data.dispatcher; 

        let self = this;
        this.event_listener.addEventListener('data_load', function () { 
            self.render();
        })

        if (this.app) {
            this.app.view_data = this.data; 
        }

        this.data_loaded = false; 
    }

    change_filter(index) { 
        if (index == this.filter_index) {
            return; 
        }

        this.filter_index = index;
        this.$view.css('border-color',FILTER.COLORS[index]);
        this.load_data(session.filters[index]);
        this.render();

    }

    // unload the data associated with this view
    // unload_data() { 
    //     this.data = null; 
    //     this.data_loaded = false; 
    // }

    // attach this view to a DOM view 
    attach(DOM_element) { 
        this.view = DOM_element; 
        this.$view = $(this.view);
    }

    // update the view and re render the app based on new data
    render() { 
        // get the width and height of the view just to be sure 
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        // if there is data then reload it 
        if (this.data_loaded) { 
            this.data.update(); 
        }

        if (this.app) { 
            this.app.update(this); 
        }
    }

    // refresh the view and corresponding app after a resize 
    refresh() { 
        // get the width and height of the view 
        this.width = this.$view.css('width'); 
        this.height = this.$view.css('height'); 

        this.app_width = this.width; 
        this.app_height = parseInt(this.height) * 0.90; 

        this.$plate.css('width',this.app_width)
            .css('height',this.app_height);

        this.$toolbar.css('width',this.app_width) 
            .css('height',parseInt(this.height) * 0.1);

        // if we have an app update the view 
        if (this.app) { 
            this.app.update(this); 
        }
    }

    // clean the app and remove the 
    clean() { 
        if (this.app) { 
            this.app.clean(); 
        }
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

    // update the dimensions of the app based on the view
    update(view) { 
        if (!this.mounted) {
            throw 'cannout update an unmounted app'; 
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 
        this.clean(); 
        this.render(); 
    }

    // mount the app to a view 
    mount(view) { 
        if (this.mounted) {
            throw "App is already mounted";
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 
        this.view_data = view.data; 
        this.mounted = true; 

        // put this apps stage on the view
        view.$plate.append(this.$stage); 
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

    is_mounted() { 
        return this.mounted; 
    }

    render() {}
    clean() {}   
}

// Map visual application 
class Geo extends App{ 
    constructor() {
        super(); 

        // establish the context for the map 
        this.stage = document.createElement('div');
        this.$stage = $(this.stage); // do not use the Jquery object for this app 
        this.$stage.attr('id','geography-app');

        this.svg = null
        this.zoomed = null;

        this.satellite = false; 
        this.color = false; 
    }

    render() { 
        this.$stage.css('width',this.view_width);
        this.$stage.css('height',this.view_height);

        let self = this, 
            d3_stage = d3.select(this.stage),
            width = parseInt(this.view_width), 
            height = parseInt(this.view_height); 

        this.svg = d3_stage.append('svg')
            .attr('class','map')
            .attr('width',width)
            .attr('height',height);

        // attach a background to the map to change color
        this.svg.append("rect")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("fill", "#ccc");
        
        let cvs = null, 
            ctx = null; 
    
        this.canvas = d3_stage.append(function () { 
            cvs = document.createElement('canvas');
            ctx = cvs.getContext('2d'); 
            return cvs; 
            })
            .attr('class','map')
            .attr('width',width)
            .attr('height',height);

        // append an element for the land
        this.land = this.svg.append('g'); 

        // create zoom behavior
        const zoom = d3.zoom()
            .on('zoom', () => {
                self.land.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
                self.land.attr('transform', d3.event.transform);
                ctx.save(); 
                ctx.clearRect(0,0,width,height); 
                ctx.translate(d3.event.transform.x,d3.event.transform.y); 
                ctx.scale(d3.event.transform.k,d3.event.transform.k); 
                draw_plumes(); 
                ctx.restore(); 
                self.zoomed = d3.event.transform;
                
            })
            .scaleExtent([1,Infinity])
            .translateExtent([[0,0],[width,height]]);

        // attacch zoom behavior
        // this.svg.call(zoom)
        this.canvas.call(zoom); 

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

        draw_plumes();

        if (this.zoomed) { 
            self.land.style('stroke-width', `${1.5 / self.zoomed.k}px`);
            self.land.attr('transform', self.zoomed);
            ctx.save(); 
            ctx.clearRect(0,0,width,height); 
            ctx.translate(self.zoomed.x,self.zoomed.y); 
            ctx.scale(self.zoomed.k,self.zoomed.k); 
            draw_plumes(); 
            ctx.restore(); 
            this.canvas.call(zoom.transform,self.zoomed); 
        }

        function draw_plumes() { 
            if (self.view_data) { 
                self.view_data.data().forEach(function(plume) { 
                    // console.log('no');
                    if (self.color) { 
                        ctx.fillStyle = biome_colors[plume.p_biome_id];
                    } else { 
                        ctx.fillStyle = 'rgb(230, 134, 134)';
                    }
                    let [x,y] = self.projection([plume.p_src_long,plume.p_src_lat]); 
                    // ctx.moveTo(x,y);
                    ctx.beginPath(); 
                    ctx.arc(x,y, 0.5, 0, 2 * Math.PI);
                    ctx.closePath(); 
                    ctx.fill();
                });
                // ctx.stroke();
                ctx.fill();
            }
        }
        
        
    }
    clean() { 
        if (this.svg) { 
            this.svg.remove(); 
            this.canvas.remove();
        }
    }

}


// // Map visual application 
class Plot extends App{ 
    constructor(x_conf,y_conf) {
        super(); 
        // if (x_conf == y_conf) throw 'please stop';
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

        this.x_conf = x_conf; 
        this.y_conf = y_conf; 

        this.bgc = 'rgb(255,255,255)';
        this.color = false; 
        this.plot = true;
    }

    render() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);
    }

    clean() { 
        this.$stage.css('width',0); 
        this.$stage.css('height',0);
    }

    setData() { 
        alert('Plot not fully implemented');
    }
}

class Pie extends Plot { 
    constructor(x_conf,y_conf) { 
        super(x_conf,y_conf); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let value = Array.apply(null, Array(17)).map(Number.prototype.valueOf,0);

        // alert(value);

        this.view_data.data().forEach(function(plume,i) { 

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
            b.push(biome_names[i]);
            c.push(biome_colors[i]);
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
            height: this.view_height * 0.5, 
            width: this.view_width * 0.5, 
        }
        this.data = [trace1];
        this.layout = layout; 
    }
}

class ScatterPlot extends Plot { 
    constructor(x_conf,y_conf) { 
        super(x_conf,y_conf); 
    }

    setData() { 
        let trace1 = {}; 
        let layout = {}; 
        let x =[];
        let xstr = '';
        let ystr = ''; 
        let y =[]; 

        let colors = []; 
        let self = this;

        this.view_data.data().forEach(function(plume,i) { 

            let opt = plume.p_avg_opt_depth; 
            let ab = plume.p_avg_ss_albedo; 
            if (!opt || !ab) { 
                return; 
            }
            
            if (self.x_conf == 0) { 
                x.push(plume.p_total_frp); 
                xstr = 'total frp (kW)';
            } else if (self.x_conf == 1) { 
                x.push(plume.p_max_ht); 
                xstr = 'max plume height (m)';
            } else if (self.x_conf == 2) { 
                x.push(plume.p_avg_opt_depth[1]);
                xstr = 'AOD';
            } else {
                x.push(plume.p_avg_ss_albedo[1]);
                xstr = 'SS Albedo';
            }

            if (self.y_conf == 0) { 
                y.push(plume.p_total_frp); 
                ystr = 'total frp (kW)';
            } else if (self.y_conf == 1) { 
                y.push(plume.p_max_ht); 
                ystr = 'max plume height (m)';
            } else if (self.y_conf == 2) { 
                y.push(plume.p_avg_opt_depth[1]);
                ystr = 'AOD';
            } else {
                y.push(plume.p_avg_ss_albedo[1]);
                ystr = 'SS Albedo';
            }
            
            colors.push(biome_colors[plume.p_biome_id])   
        }); 

        let use_color = null; 

        if (this.color) { 
            use_color = colors; 
        } else { 
            use_color = 'rgb(246,149,149)';
        }
        trace1 = {
            type: 'scatter',
            x: x,
            y: y,
            mode: 'markers',
            marker : {
                color : use_color, 
                // color : colors,
            }
        };

    
        layout = { 
            // showlegend: false,
            // hovermode: 'closest',
            // height: 500,
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 10,
            },
            xaxis : {
                title : xstr, 
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals, 
            },
            yaxis : { 
                title : ystr,
                // tickmode : "array",   
                // ticktext : biomebins, 
                // tickvals : biomevals,  
            },
        };
        this.data = [trace1];
        this.layout = layout; 
        this.$stage.on('plotly_selected',function(event) {
            alert('ah');
        })
    }
}

// let months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

// class ScatterPlot2 extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 
//         let trace1 = {}; 
//         let trace2 = {}; 
//         let layout = {}; 
//         let x = Array.apply(null, Array(12)).map(Number.prototype.valueOf,0);
//         let y = Array.apply(null, Array(5000)).map(Number.prototype.valueOf,0);
//         let x1 = x; 
//         let y1 = y; 
//         // let colors = []; 

//         this.view_data.forEach(function(plume,i) { 
//             let month = plume.p_date.split('-')[1];
//             if (plume.p_avg_ss_albedo == null) {
//                 return; 
//             }
//             let frp = plume.p_avg_ss_albedo[1]*50; 
//             frp = Math.round(frp); 
//             x[frp] += 1; 
//             // let ht = Math.round(plume.p_med_ht); 
//             // console.log(ht); 
//             // if (plume.p_biome_id == 0) {
//             //     x[ht] += 1;
//             // } else if (plume.p_biome_id == 4) { 
//             //     y[ht] += 1; 
//             // }
//             // x.push(plume.p_total_frp); 
//             // y.push(plume.p_max_ht);    
//             // colors.push(biomecolors[plume.p_biome_id])   
//         }); 

//         // let x = [];
//         // for (var i = 0; i < 12; i ++) {
//         //     x[i] = Math.random();
//         // }

//         trace1 = {
//             y: x,
//             // x: months, 
//             type: 'bar',
//             // autobinx: false, 
//             // xbins : { 
//             //     start : 0, 
//             //     end : 11, 
//             //     size: 1,
//             // }

//         };
//         // var data = [trace];
//         // Plotly.newPlot('myDiv', data);

//         // alert(x); 
//         // alert(y); 

//         // trace1 = {
//         //     type: 'scatter',
//         //     x: x,
//         //     y: y,
//         //     mode: 'markers',
//         //     marker : {
//         //         // color : 'rgb(246,149,149)', 
//         //         color : colors,
//         //     }
//         // };

    
//         // layout = { 
//         //     title: 'Max Plume Height vs Biome',
//         //     showlegend: false,
//         //     hovermode: 'closest',
//         //     xaxis : {
//         //         title : 'Total FRP', 
//         //         // tickmode : "array",   
//         //         // ticktext : biomebins, 
//         //         // tickvals : biomevals, 
//         //     },
//         //     yaxis : { 
//         //         title : 'Max Plume Height (m)', 
//         //     },
//         //     sliders: [{
//         //         // pad: {t: 30},
//         //         currentvalue: {
//         //           xanchor: 'right',
//         //           prefix: 'color: ',
//         //           font: {
//         //             color: '#888',
//         //             size: 20
//         //           }
//         //         }
//         //     }]
//         // }

//         // trace1 = { 
//         //     x: x, 
//         //     // x : x1,
//         //     type: 'histogram', 
//         //     color: 'red',
//         //     xbins: { 
//         //         end: 5000, 
//         //         size: 0.06, 
//         //         start: -3.2
            
//         //       },

//         //     // autobinx : false,
//         // }

//         // trace2 = {
//         //     x: y, 
//         //     // x: x1, 
//         //     type: 'histogram',
//         //     color: 'blue',

//         // }

//         layout = { 
//             title : 'Total Fire Radiative Power by Month', 
//             bargap: 0.05, 
//             // bargroupgap: 1, 
//             // barmode: 'stack'
//         }
//         this.data = [trace1];
//         this.layout = layout; 
//     }
// }

// class ParallelPlot extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 
//         let trace1 = {}; 
//         let layout = {}; 
//         let c1 = [];
//         let c2 = []; 
//         let c3 = [];
//         let c4 = []; 
//         let colors = []; 

//         this.view_data.forEach(function(plume,i) { 

//             c1.push(plume.p_max_ht); 
//             c2.push(plume.p_total_frp); 
//             c3.push(plume.p_perimeter); 
//             c4.push(plume.p_max_angstrom);   
//             colors.push(biomecolors[plume.p_biome_id]); 
//         }); 

//         trace1 = {
//             type: 'parcoords',
//             line: {
//                 color: biomecolors[10],
//                 // color: colors,  
//                 opacity: 0.5,
//             },
            
//             dimensions: [{
//             //   range: [1, 5],
//             //   constraintrange: [1, 2],
//               label: 'Total FRP',
//               values: c2
//             }, {    
//             //   range: [1,5],
//               label: 'Plume Height',
//               values: c1,
//             //   tickvals: [1.5,3,4.5]
//             }, {
//             //   range: [1, 5],
//               label: 'Plume Perimeter',
//               values: c3,
//             //   tickvals: [1,2,4,5],
//             //   ticktext: ['text 1','text 2','text 4','text 5']
//             }, {
//             //   range: [1, 5],
//               label: 'Max Angstrom',
//               values: c4
//             }]
//           };

//         layout = { 
//             title: 'Parallel Coordinates',
//         }

//         this.data = [trace1];
//         this.layout = layout; 
//     }
// }


// class Map extends Plot { 
//     constructor() { 
//         super(); 
//     }

//     setData() { 

//         // let data_instance = []; 
//         let latitudes = []; 
//         let longitudes = []; 
//         let trace1 = {}; 
//         let layout = {}; 
//         let colors =[]; 

//         this.view_data.forEach(function(plume,i) { 
//             latitudes.push(plume.p_src_lat); 
//             longitudes.push(plume.p_src_long);   
//             colors.push(biomecolors[plume.p_biome_id]);  
//         }); 

//         trace1 = {
//             type: 'scattergeo',
//             locationmode: 'ISO-3',
//             lat: latitudes,
//             lon: longitudes,
//             marker: {
//                 size: 3,
//                 // color: 'rgb(246,149,149)',
//                 // opacity: 0.05, 
//                 color: colors,
//             }
//         };

//         layout = { 
//             // title: 'Map',
//             showlegend: false,
//             geo: {
//                 scope: 'world',
//                 showocean: true, 
//                 oceancolor: 'rgb(242,242,242)',
//                 showcoastlines: false,
//                 coastlinewidth: 0, 
//                 coastlinecolor: 'rgb(255,255,255)',
//                 showland: false,
//                 landcolor: 'rgb(255, 255, 255)',
//                 subunitwidth: 1,
//                 countrywidth: 1,
//                 subunitcolor: 'rgb(255,255,255)',
//                 countrycolor: 'rgb(255,255,255)'
//             },
//         }

//         this.data = [trace1];
//         this.layout = layout; 

//         // let s = document.getElementById('chart'); 

//         // this.stage.on('plotly_selected', function(eventdata) { 
//         //     latitudes = []; 
//         //     longitudes = []; 
//         //     console.log(eventData.points); 
//         //     eventData.points.forEach(function(pt) {
                
//         //         colors[pt.pointNumber] = color1;
//         //       });
//         //     Plotly.newPlot(this.stage,this.data,this.layout,this.conf);
//         // }); 
//     }
// }