// javascript to control the view interface and establish various visual elements 
const event = new CustomEvent('data_load');
// const event = new CustomEvent('data_change');

// Class representing a data object 
class Filter { 
    // when you construct the data object we retrieve a data query from 
    // the current filters and save that into the content of the object 
    constructor(biome_set,region_set,fill) { 
        this.max_frp = $('#max-frp').val();
        this.min_frp = $('#min-frp').val(); 
        this.max_plume_ht = $('#max-ph').val(); 
        this.min_plume_ht = $('#min-ph').val(); 
        this.start_date = $('#start-date').val();
        this.end_date = $('#end-date').val();

        this.biome_set = new Set(biome_set); 
        this.region_set = new Set(region_set); 

        // these are the actual variables used by a view to interact with data
        this.content = []; 
        this.mask = false;
        this.mask = [];
        this.num_plumes = 0; 

        // create an event dispatcher 
        this.dispatcher = new EventTarget(); 

        // whether or not the data is ready 
        this.ready = false; 
        if (fill) this.get(); 
    }

    // load this data to the filter set 
    load() { 
        let self = this; 
        // console.log('load new filter');
        $('#max-frp').val(this.max_frp);
        $('#min-frp').val(this.min_frp); 
        $('#max-ph').val(this.max_plume_ht); 
        $('#min-ph').val(this.min_plume_ht); 
        $('#start-date').val(this.start_date);
        $('#end-date').val(this.end_date);

        session.biomes.clear(); 
        session.regions.clear();

        $('.multiSel.0').empty();
        $('.multiSel.1').empty();

        $('#biome-drop > li > input').each(function() {
            // console.log($(this).val());
            $(this).prop('checked',false);
        })

        $('#region-drop > li > input').each(function() {
            // console.log($(this).val());
            $(this).prop('checked',false);
        })

        if (this.biome_set.size == 0) { 
            $('.hida.0').show();
        } else{ 
            $('.hida.0').hide();
            this.biome_set.forEach(function(id) {
                session.biomes.add(id);
                $('.multiSel.0').append('<span title="biome' + id + '">' + biome_names[id] + ',</span>');
            }) 

            $('#biome-drop > li > input').each(function(i) {
                // console.log($(this).val());
                if (self.biome_set.has(i.toString())) $(this).prop('checked',true);
            })
        }

        if (this.region_set.size == 0) { 
            $('.hida.1').show();
        } else {
            $('.hida.1').hide();
            this.region_set.forEach(function(id) {
                session.regions.add(id);
                $('.multiSel.1').append('<span title="region' + id + '">' + region_names[id] + ',</span>');
            })

            $('#region-drop > li > input').each(function(i) {
                // console.log($(this).val());
                console.log(i);
                if (self.region_set.has(i.toString())) $(this).prop('checked',true);
            })
        }
        

        
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

        // alert(Array.from(biome_set));
        this.biome_set = new Set(biome_set); 
        this.region_set = new Set(region_set); 
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
                if (!self.masked) { 
                    self.mask = Array.apply(null, Array(data.length)).map(Number.prototype.valueOf,0);
                }
                
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

    is_masked(index) { 
        return this.mask[index];
    }

    nudge() { 
        this.dispatcher.dispatchEvent(event);
    }

    reset_mask() { 
        this.masked = false; 
        this.mask = Array.apply(null, Array(this.content.length)).map(Number.prototype.valueOf,0);
        this.nudge();
    }
}

// Class object representing a given view. The view is the basic building block for 
// the visual interface, views host apps and load data which is displayed by the app.
// the view properties are controlled by the sidebar. A view must be built on a data 
// filter and given a number 0 - 3 
class View { 
    constructor(view,filter_index,view_index) { 
        // is the view currently rendered 
        this.rendered = false; 

        this.locked = false; 

        let self = this;
        // the view object must be passed a DOM object on creation, thus actual 
        // creation of the view element is not the responsibilty of the view class 
        // the view class merely attaches functionality to an already existing object
        this.view = view; // the DOM object that the view is on 
        this.$view = $(this.view) // jquery 

        // make the border of the view show the data filter this view is being built on 
        this.$view.css('border-color',FILTER.COLORS[filter_index]);

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
            // let view = $(this).parent().parent();
            self.change_filter(val);
        })

        let $edit = null; 

        if (view_index == 0) { 
            $edit = $('<div class="view-edit active" data-value="' + view_index +'"> edit </div>')
                .click(function(event) {
                    if ($(event.target).hasClass('active')) { 
                        return; 
                    }
                    $('.view-edit.active').removeClass('active');
                    $(event.target).addClass('active');
                    session.select_view($(event.target).attr('data-value'));
                })
        } else {
            $edit = $('<div class="view-edit" data-value="' + view_index +'"> edit </div>')
                .click(function(event) {
                    if ($(event.target).hasClass('active')) { 
                        return; 
                    }
                    $('.view-edit.active').removeClass('active');
                    $(event.target).addClass('active');
                    session.select_view($(event.target).attr('data-value'));
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
        this.data = session.filters[filter_index]; 
        this.event_listener = this.data.dispatcher; 

        // let self = this;
        this.event_listener.addEventListener('data_load', function () { 
            self.render();
        })
        
        // index to uniquely reference this view
        this.filter_index = filter_index; 

        this.view_index = view_index;
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
        if (this.locked) { 
            return; 
        }
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

    lock() { 
        this.locked = true; 
    }

    unlock() { 
        this.locked = false; 
    }

    deselect() { 
        $('.view-controls').empty();
    }

    select() { 
        if (!this.app) { 
            return; 
        }

        let controls = $(this.app.plot_controls());
        $('.view-controls').append(controls);
        this.app.register_controls(); 
    }
}

// bas class for all applications 
class App { 
    constructor() { 
        // start the object with view width
        this.view_width = 0; 
        this.view_height = 0; 
        this.view_data = null; 

        this.view_index = null; 

        this.bgc = 'rgb(255,255,255)';

        // these need to be set by a specific app constructor
        this.stage = null; 
        this.$stage = null; 

        // whether or not this app is attached to a view 
        this.mounted = false; 
        this.color = 0;

        this.built = false; 
    }

    // update the dimensions of the app based on the view
    update(view) { 
        if (!this.mounted) {
            throw 'cannout update an unmounted app'; 
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 

        if (!this.built) { 
            this.build();
        }
        // this.clean(); 
        this.render(); 
        this.built = true;
    }

    // mount the app to a view 
    mount(view) { 
        if (this.mounted) {
            throw "App is already mounted";
        }
        this.view_width = view.app_width; 
        this.view_height = view.app_height; 
        this.view_data = view.data; 
        this.view_index = view.view_index; 
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

    lock_view() { 
        session.lock(this.view_index);
    }

    unlock_view() { 
        session.unlock(this.view_index);
    }

    build() {}
    render() {}
    clean() {}   
    plot_controls() {}
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

        this.vs = `attribute vec4 aVertexPosition;
        
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
        
            void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            }`;

        this.fs = `void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }`;
    }

    load_shader(gl,type,source) { 
        const shader = gl.createShader(type);

        // Send the source to the shader object
        gl.shaderSource(shader, source);

        // Compile the shader program
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    create_shader_program(gl) {
        const vertex_shader = this.load_shader(gl, gl.VERTEX_SHADER, this.vs);
        const fragment_shader = this.load_shader(gl, gl.FRAGMENT_SHADER, this.fs);
      
        // Create the shader program
        const shader = gl.createProgram();
        gl.attachShader(shader, vertex_shader);
        gl.attachShader(shader, fragment_shader);
        gl.linkProgram(shader);
      
        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
          alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
          return null;
        }
      
        return shader;
    }

    create_buffers(gl) {
        // Create a buffer for the square's positions.

        const positionBuffer = gl.createBuffer();

        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Now create an array of positions for the square.
        const positions = [
            -1.0,  1.0,
            1.0,  1.0,
            -1.0, -1.0,
            1.0, -1.0,
        ];

        // Now pass the list of positions into WebGL to build the
        // shape. We do this by creating a Float32Array from the
        // JavaScript array, then use it to fill the current buffer.
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);

        return {
            position: positionBuffer,
        };
    }

    drawScene(gl, programInfo, buffers) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
      
        // Clear the canvas before we start drawing on it.
      
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.
      
        const fieldOfView = 360 * Math.PI / 180;   // in radians
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();
      
        // note: glmatrix.js always has the first argument
        // as the destination to receive the result.
        mat4.perspective(projectionMatrix,
                         fieldOfView,
                         aspect,
                         zNear,
                         zFar);
      
        // Set the drawing position to the "identity" point, which is
        // the center of the scene.
        const modelViewMatrix = mat4.create();
      
        // Now move the drawing position a bit to where we want to
        // start drawing the square.
      
        mat4.translate(modelViewMatrix,     // destination matrix
                       modelViewMatrix,     // matrix to translate
                       [-0.0, 0.0, -6.0]);  // amount to translate
      
        // Tell WebGL how to pull out the positions from the position
        // buffer into the vertexPosition attribute.
        {
          const numComponents = 2;  // pull out 2 values per iteration
          const type = gl.FLOAT;    // the data in the buffer is 32bit floats
          const normalize = false;  // don't normalize
          const stride = 0;         // how many bytes to get from one set of values to the next
                                    // 0 = use type and numComponents above
          const offset = 0;         // how many bytes inside the buffer to start from
          gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
          gl.vertexAttribPointer(
              programInfo.attrib.position,
              numComponents,
              type,
              normalize,
              stride,
              offset);
          gl.enableVertexAttribArray(
              programInfo.attrib.position);
        }
      
        // Tell WebGL to use our program when drawing
      
        gl.useProgram(programInfo.shader);
      
        // Set the shader uniforms
      
        gl.uniformMatrix4fv(
            programInfo.uniform.projection,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniform.model,
            false,
            modelViewMatrix);
      
        {
          const offset = 0;
          const vertexCount = 4;
          gl.drawArrays(gl.POINTS, offset, vertexCount);
        }
      }

    old_render() { 
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
            gl = null; 
    
        this.canvas = d3_stage.append(function () { 
            cvs = document.createElement('canvas');
            gl = cvs.getContext('webgl'); 
            return cvs; 
            })
            .attr('class','map')
            .attr('width',width)
            .attr('height',height);

        let shader = this.create_shader_program(gl);

        let program = {
            shader: shader,
            attrib: {
                position: gl.getAttribLocation(shader, 'aVertexPosition'),
            },
            uniform: {
                projection: gl.getUniformLocation(shader, 'uProjectionMatrix'),
                model: gl.getUniformLocation(shader, 'uModelViewMatrix'),
            },
        };

        let buffers = this.create_buffers(gl);

        this.drawScene(gl,program,buffers);

        // gl.clearColor(0.0,0.0,0.0,0.5);
        // gl.clear(ctx.COLOR_BUFFER_BIT);

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
                console.log(d3.event.transform.k);
                draw_plumes(1/d3.event.transform.k); 
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

        draw_plumes(1);

        if (this.zoomed) { 
            self.land.style('stroke-width', `${1.5 / self.zoomed.k}px`);
            self.land.attr('transform', self.zoomed);
            ctx.save(); 
            ctx.clearRect(0,0,width,height); 
            ctx.translate(self.zoomed.x,self.zoomed.y); 
            ctx.scale(self.zoomed.k,self.zoomed.k); 
            draw_plumes(1/Math.round(self.zoomed.k)); 
            ctx.restore(); 
            this.canvas.call(zoom.transform,self.zoomed); 
        }

        function draw_plumes(ratio) { 
            if (self.view_data) { 
                self.view_data.data().forEach(function(plume,i) { 
                    
                    if (self.view_data.masked) { 
                        if (self.view_data.is_masked(i) == 1) { 

                            ctx.globalAlpha = 1; 
                        } else { 
                            ctx.globalAlpha = 0.01;
                        }
                    }
                        
                    if (self.color == 1) { 
                        ctx.fillStyle = biome_colors[plume.p_biome_id];
                    } else if (self.color == 2) {
                        ctx.fillStyle = region_colors[plume.p_region_id];
                    }else { 
                        ctx.fillStyle = 'rgb(230, 134, 134)';
                    }
                    let [x,y] = self.projection([plume.p_src_long,plume.p_src_lat]); 
                    // ctx.moveTo(x,y);
                    ctx.beginPath(); 
                    ctx.arc(x,y, 1 * ratio + 0.1, 0, 2 * Math.PI);
                    ctx.closePath(); 
                    ctx.fill();
                });
                // ctx.stroke();
                ctx.fill();
            }
        }
        
    }

    build() { 
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
        // this.svg.append("rect")
        //     .attr("width", "100%")
        //     .attr("height", "100%")
        //     .attr("fill", "#ccc");
        
        let cvs = null, 
            ctx = null; 
    
        // this.canvas = d3_stage.append(function () { 
        //     return document.createElement('canvas'); 
        //     })
        //     .attr('class','map')
        //     .attr('id','soap');

        // let options = { 
        //     view: self.canvas.node(), 
        //     width: width,
        //     height: height,
        //     antialias: true,
        //     transparent: true,
        // }

        // this.points = new PIXI.Application(options);

        // this.graphics = new PIXI.Graphics(); 
        // this.graphics.alpha = 1;

        // this.points.stage = this.graphics;
        // this.scale_level = 1;

        // let self = this; 
        $('#scale-btn').click(function() { 
            alert(self.scale);
        }); 

        // create zoom behavior
        // this.zoom = d3.zoom()
        //     .on('zoom', () => {
        //         self.land.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
        //         self.land.attr('transform', d3.event.transform);
        //         self.graphics.position.x = d3.event.transform.x; 
        //         self.graphics.position.y = d3.event.transform.y; 
        //         self.graphics.scale.x = d3.event.transform.k;
        //         self.graphics.scale.y = d3.event.transform.k;
        //         if (Math.floor(d3.event.transform.k) != this.scale_level) { 
        //             self.scale_level = Math.floor(d3.event.transform.k); 
        //             // console.log(self.graphics);
        //             self.graphics.graphicsData = self.graphics.graphicsData.map((t) => {
        //                 t.shape.radius = 2/self.scale_level;
        //                 return t; 
        //             })

        //             self.graphics.dirty++; 
        //             self.graphics.clearDirty++;
        //             self.points.render();

        //         }
                
                

        //         // console.log(self.graphics.grap)
        //         // self.graphics.renderWebGL();
        //         // self.scale = d3.event.transform.k;
                
        //         // self.draw_plumes(d3.event.transform.k);
      
        //         // self.zoomed = d3.event.transform;
                
        //     })
        //     .scaleExtent([1,Infinity])
        //     .translateExtent([[0,0],[width,height]]);

        // this.canvas.call(this.zoom);
    }

    render() { 
        // // this.graphics.scale = 1;

        // for (let i = 0; i < 70000; i++) { 
        //     this.graphics.beginFill(0xe68686);
        //     this.graphics.drawCircle(Math.random() * 2000,Math.random() * 200,2); 
        //     this.graphics.endFill();
        // }
        
        let width = parseFloat(this.view_width), 
            height = parseFloat(this.view_height); 

        // this.points.render();

        // append an element for the land
        this.land = this.svg.append('g'); 

        let self = this; 

        let data = []; 
        let color = []; 
        this.view_data.data().forEach(function(plume){ 
            color = biome_colors_arr[plume.p_biome_id].slice();
            color.push(255);
            data.push([parseFloat(plume.p_src_long),parseFloat(plume.p_src_lat),color])
        });

        console.log(data);

        let scatter = new deck.ScatterplotLayer({
            id: 'points', 
            radiusMaxPixels: 5,
            radiusMinPixels: 5,
            // radiusScale: 1
            getRadius: function(d) {return 0.5},
            getPosition: function(d) {return [d[0],d[1],0];}, 
            getColor: function(d) {return d[2]},
            data: data

        })

        let deck_options = { 
            id: 'geo-deck',
            container: 'geography-app',
            mapboxApiAccessToken: 'pk.eyJ1IjoiamJvb25lIiwiYSI6ImNqa3o2cjVhdTA2OHkzcG0wOHU4OXplNTMifQ.b3gc6bHvJM8MChCUDZQPKw',
            mapStyle: 'mapbox://styles/mapbox/satellite-v9',
            // mapStyle: 'mapbox://styles/mapbox/light-v9',
            viewState : { 
            longitude: 0,
            latitude: 0,
            zoom: 0.5,
            maxZoom: 12, 
            minZoom: 0.5,
            },
          

            // views: new View({}),
            layers: [
                // new deck.GeoJsonLayer({
                //     id: 'yo',
                //     data: geojson,
                //     getFillColor: [160, 160, 180, 200],
                // }),
                scatter
              ]

        }

        // new deck.DeckGL({
            
        //     longitude: -74,
        //     latitude: 40.76,
        //     zoom: 11,
        //     maxZoom: 16,
        //     layers: [
        //       new deck.ScatterplotLayer({
        //         id: 'scatter-plot',
        //         data: 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/scatterplot/manhattan.json',
        //         radiusScale: 10,
        //         radiusMinPixels: 0.5,
        //         getPosition: d => [d[0], d[1], 0],
        //         // getColor: d => (d[2] === 1 ? MALE_COLOR : FEMALE_COLOR)
        //       })
        //     ]
        //   });
      

        let dk = new deck.DeckGL(deck_options);
        console.log(dk); 

        // let zoom_barrier = d3.zoom()
        //     .scaleExtent([1,Infinity])
        //     .translateExtent([[0,0],[width,height]]);

        // let k = d3.select('#geo-deck')
        //     .call(zoom_barrier); 

        // // attacch zoom behavior
        // // this.svg.call(zoom)
        // this.canvas.call(zoom); 

        // create projection 
        // this.projection = d3.geoEquirectangular()
        //     .fitSize([width,height],geojson);

        // this.geoPath = d3.geoPath().projection(this.projection); 

        // this.land.selectAll('path')
        //     .data(geojson.features)
        //     .enter()
        //     .append('path')
        //     .attr('fill', '#fff')
        //     .attr('d', this.geoPath);

        // return;

        // this.draw_plumes(1);

        // if (this.zoomed) { 
        //     self.land.style('stroke-width', `${1.5 / self.zoomed.k}px`);
        //     self.land.attr('transform', self.zoomed);
        //     ctx.save(); 
        //     ctx.clearRect(0,0,width,height); 
        //     ctx.translate(self.zoomed.x,self.zoomed.y); 
        //     ctx.scale(self.zoomed.k,self.zoomed.k); 
        //     draw_plumes(1/Math.round(self.zoomed.k)); 
        //     ctx.restore(); 
        //     this.canvas.call(zoom.transform,self.zoomed); 
        // }

        // function draw_plumes(ratio) { 
        //     if (self.view_data) { 
        //         self.view_data.data().forEach(function(plume,i) { 
                    
        //             if (self.view_data.masked) { 
        //                 if (self.view_data.is_masked(i) == 1) { 

        //                     ctx.globalAlpha = 1; 
        //                 } else { 
        //                     ctx.globalAlpha = 0.01;
        //                 }
        //             }
                        
        //             if (self.color == 1) { 
        //                 ctx.fillStyle = biome_colors[plume.p_biome_id];
        //             } else if (self.color == 2) {
        //                 ctx.fillStyle = region_colors[plume.p_region_id];
        //             }else { 
        //                 ctx.fillStyle = 'rgb(230, 134, 134)';
        //             }
        //             let [x,y] = self.projection([plume.p_src_long,plume.p_src_lat]); 
        //             // ctx.moveTo(x,y);
        //             ctx.beginPath(); 
        //             ctx.arc(x,y, 1 * ratio + 0.1, 0, 2 * Math.PI);
        //             ctx.closePath(); 
        //             ctx.fill();
        //         });
        //         // ctx.stroke();
        //         ctx.fill();
        //     }
        // }
        
        
    }

    draw_plumes(scale) { 
        let self = this;
        this.graphics.clear();
        if (this.view_data) { 
            this.view_data.data().forEach(function(plume,i) { 
                
                // if (self.view_data.masked) { 
                //     if (self.view_data.is_masked(i) == 1) { 

                //         ctx.globalAlpha = 1; 
                //     } else { 
                //         ctx.globalAlpha = 0.01;
                //     }
                // }
                    
                // if (self.color == 1) { 
                //     ctx.fillStyle = biome_colors[plume.p_biome_id];
                // } else if (self.color == 2) {
                //     ctx.fillStyle = region_colors[plume.p_region_id];
                // }else { 
                //     ctx.fillStyle = 'rgb(230, 134, 134)';
                // }
                let [x,y] = self.projection([plume.p_src_long,plume.p_src_lat]);

                self.graphics.beginFill(0xe68686);
                self.graphics.drawCircle(x,y,1); 
                self.graphics.endFill();
            });
            // this.graphics.clear();
            this.points.render();
        }
    }

    clean() { 
        if (this.svg) { 
            this.svg.remove(); 
            this.canvas.remove();
        }
    }

    plot_controls() { 
        let str = '<div class="plot-type">   \
            Plot Type: \
            <select class="plot-selection">  \
                <option value="0" selected="selected">Geography</option> \
                <option value="1">Scatter</option> \
                <option value="2">Pie</option> \
                <option value="3">Parallel Coordinates</option> \
            </select> \
            <div class="plot-options"> \
                color \
                <select class="plot-color"> \
                    <option value="0" selected="selected">None</option> \
                    <option value="1">Biome</option> \
                    <option value="2">Region</option> \
                </select> \
            </div> \
        </div>'

        return str; 
    }

    register_controls() { 
        let self = this;
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.select_view(session.selected_view);
        });

        $('.plot-color').change(function() { 
            self.color = $(this).val(); 
            self.render();
        });
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
        this.plot = true;
    }

    render() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);

        let self = this;

        this.stage.on('plotly_selected',function(event) {
            // alert('selection');
            let points = event.points;
            let old_mask = self.view_data.mask.slice(); 
            let new_mask = old_mask.map(_ => 0);

            points.forEach(function(point) { 
                new_mask[point.customdata] = 1; 
            })


            if (self.view_data.masked) { 
                self.view_data.mask = new_mask.map((x,i) => { 
                    return x & old_mask[i];
                });
            } else { 
                self.view_data.mask = new_mask;
            }

            self.lock_view();
            self.view_data.masked = true; 
            self.view_data.nudge();
            self.unlock_view();
        })
    }

    clean() { 
        this.$stage.css('width',0); 
        this.$stage.css('height',0);
    }

    setData() { 
        alert('Plot not fully implemented');
    }

    register_controls() { 
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.change_view(session.selected_view);
        });
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
        let self = this; 
        let opacity = [];

        this.view_data.data().forEach(function(plume,i) { 

            if (self.view_data.masked) { 
                if (!self.view_data.is_masked(i)) {
                    return;
                }
            }

            if (self.x_conf == 0) {
                value[plume.p_biome_id]++;  
            } else if (self.x_conf == 1) { 
                value[plume.p_region_id]++;
            }
             
        }); 

        let v = []; 
        let b = [];
        let c = []; 
        let custom = [];

        value.forEach(function(p,i) { 
            if (value[i] == 0) {
                return
            }

            v.push(value[i]); 

            if (self.x_conf == 0) { 
                b.push(biome_names[i]);
                c.push(biome_colors[i]);
                custom.push(i);
            } else if (self.x_conf == 1) { 
                b.push(region_names[i]);
                c.push(region_colors[i]);
                custom.push(i);
            }
            
        })

        trace1 = {
            type: 'pie',
            values: v,
            labels: b,
            customdata: custom,
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

    render() { 
        this.$stage.css('width',this.view_width); 
        this.$stage.css('height',this.view_height); 

        this.$stage.css('background-color',this.bgc); 

        this.setData(); 

        Plotly.newPlot(this.stage,this.data,this.layout,this.conf);

        let self = this;

        this.stage.on('plotly_click',function(event) {
            let points = event.points;
            let old_mask = self.view_data.mask.slice(); 
            let new_mask = old_mask.map(_ => 0);

            self.view_data.data().forEach(function(plume,i) {
                if (self.x_conf) { 
                    if (plume.p_biome_id == points[0].customdata[0]) { 
                        new_mask[i] = 1;
                    }
                } else { 
                    if (plume.p_biome_id == points[0].customdata[0]) { 
                        new_mask[i] = 1;
                    }
                }
                
            });
            
            if (self.view_data.masked) { 
                self.view_data.mask = new_mask.map((x,i) => { 
                    return x & old_mask[i];
                });
            } else { 
                self.view_data.mask = new_mask;
            }

            self.lock_view();
            self.view_data.masked = true; 
            self.view_data.nudge();
            self.unlock_view();
        })
    }

    plot_controls() { 
        let str = '<div class="plot-type">   \
        Plot Type: \
        <select class="plot-selection">  \
            <option value="0">Geography</option> \
            <option value="1">Scatter</option> \
            <option value="2" selected="selected">Pie</option> \
            <option value="3">Parallel Coordinates</option> \
        </select> \
        <div class="plot-options"> \
            variable \
            <select class="plot-variable"> \
                <option value="0" selected="selected">Biome</option> \
                <option value="1">Region</option> \
            </select> \
        </div> \
    </div>'

    return str; 
    }

    register_controls() { 
        let self = this;
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            // alert(val);
            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.change_view(session.selected_view);
        });

        $('.plot-variable').change(function() { 
            self.x_conf = $(this).val(); 
            self.render();
        });
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
        let data = [];
        let opacity = []; 
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
            
            if (self.color == 2) {
                colors.push(region_colors[plume.p_region_id])
            } else { 
                colors.push(biome_colors[plume.p_biome_id])
            }
               
            if (self.view_data.is_masked(i)) { 
                opacity.push(1); 
            } else {
                opacity.push(0.1);
            }
            data.push(i);
        }); 

        let use_color = null; 

        if (this.color != 0) { 
            use_color = colors; 
        } else { 
            use_color = 'rgb(246,149,149)';
        }

        let use_opacity = null; 

        if (this.view_data.masked) { 
            use_opacity = opacity; 
        } else { 
            use_opacity = 1; 
        }
        trace1 = {
            type: 'scattergl',
            x: x,
            y: y,
            customdata: data,
            mode: 'markers',
            marker : {
                color : use_color, 
                opacity : use_opacity,
                // color : colors,
            }
        };

    
        layout = { 
            // showlegend: false,
            // hovermode: 'closest',
            // height: 500,
            margin: {
                l: 10,
                r: 10,
                b: 80,
                t: 10,
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
    }

    plot_controls() { 
        let str = '<div class="plot-type">   \
            Plot Type: \
            <select class="plot-selection">  \
                <option value="0">Geography</option> \
                <option value="1" selected="selected">Scatter</option> \
                <option value="2">Pie</option> \
                <option value="3">Parallel Coordinates</option> \
            </select> \
            <div class="plot-options"> \
                x \
                <select class="plot-x"> \
                    <option value="0" selected="selected">FRP</option> \
                    <option value="1">Height</option> \
                    <option value="2">AOD</option> \
                    <option value="3">Albedo</option> \
                </select> <br>\
                y \
                <select class="plot-y"> \
                    <option value="0">FRP</option> \
                    <option value="1" selected="selected">Height</option> \
                    <option value="2">AOD</option> \
                    <option value="3">Albedo</option> \
                </select> <br> \
                color \
                <select class="plot-color"> \
                    <option value="0" selected="selected">None</option> \
                    <option value="1">Biome</option> \
                    <option value="2">Region</option> \
                </select> \
            </div> \
        </div>'

        return str; 
    }

    register_controls() { 
        let self = this;
        $('.plot-selection').change(function() { 
            let val = $(this).val(); 
            let app = null; 

            // alert(val);
            if (val == 0) { 
                app = new Geo();
            } else if (val == 1) { 
                app = new ScatterPlot(0,1);
            } else if (val == 2) { 
                app = new Pie(0,0); 
            } else {
                app = new Parallel();
            }

            session.load_app(app);
            session.change_view(session.selected_view);
        });

        $('.plot-color').change(function() { 
            self.color = $(this).val(); 
            self.render();
        });

        $('.plot-x').change(function() { 
            self.x_conf = $(this).val(); 
            self.render();
        });

        $('.plot-y').change(function() { 
            self.y_conf = $(this).val(); 
            self.render();
        });
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

