// The main javascript file that generates and runs a MERLIN session 
// global session variables 


// state program for managing state of app 
$(document).ready(() => {

    session = new Instance(); 
    session.init();

    $('#single-btn').click(function() { 
        if (session.state == STATE.SINGLE_VIEW) { 
            return; 
        }
        session.state = STATE.SINGLE_VIEW; 
        session.load(); 
    })

    $('#quad-btn').click(function() { 
        // alert('nooo');
        if (session.state == STATE.QUAD_VIEW) { 
            return;
        }
        session.state = STATE.QUAD_VIEW; 
        session.load(); 
    })
    

    $('.supdate').change(function(){
        session.fetch_data();
    });

    $('.time-filter-enter').change(function(){
        session.fetch_data();
    });

    $('#geo_btn').click(function(){ 
        let app = new Geo(); 
        session.load_app(app); 
    })

    $('#scatter_btn').click(function(){ 
        var x = prompt('x:',0);
        var y = prompt('y:',1);

        if (x == y) { 
            alert('x and y cannot be the same');
            return; 
        }
        let app = new ScatterPlot(x,y); 
        session.load_app(app); 
    })

    $('#pie_btn').click(function() { 
        let app = new Pie(0,1); 
        session.load_app(app);
    })

    $('#color_btn').click(function(){ 
        let view = session.visible_views[session.selected_view]; 
        if (view.app.color != null) { 
            if (view.app.color) { 
                view.app.color = false; 
                view.app.render();
            } else { 
                view.app.color = true; 
                view.app.render();
            }
        }
    })


    $('.filter-btn').click(function() { 
        let index = $(this).attr('data-value');
        session.select_filter(index);
    })

    $('#wash-btn').click(function() { 
        session.filters[session.selected_filter].reset_mask();
    })



    /*
	Dropdown with Multiple checkbox select with jQuery - May 27, 2013
	(c) 2013 @ElmahdiMahmoud
	license: https://www.opensource.org/licenses/mit-license.php
    */

    let drops = ['#biome-drop','#region-drop'];
    let sets = [session.biomes,session.regions];

    $(".dropdown dt a").on('click', function() {
        let target = $(this).attr('data-target'); 
        // alert(target); 
        $(drops[target]).slideToggle('fast');
    });
    
    $(".dropdown dd ul li a").on('click', function() {
        $(drops[target]).hide();
    });
    
    $(document).bind('click', function(e) {
        var $clicked = $(e.target);
        if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
    });
    
    $('.mutliSelect input[type="checkbox"]').on('click', function() {

        var target = $(this).parent().parent().attr('data-target'); 
        let set = sets[target]; 
        let code = $(this).attr('data-code'); 
    
        var title = $(this).closest('.mutliSelect').find('input[type="checkbox"]').val(),
        title = $(this).val() + ",";
    
        if ($(this).is(':checked')) {
            var html = '<span title="' + title + '">' + title + '</span>';
            $('.multiSel.' + target).append(html);
            $(".hida." + target).hide();
            set.add(code); 
            session.fetch_data();
        } else {
            $('span[title="' + title + '"]').remove();
            // var ret = $(".hida." + target);
            // $(texts[target]).append(ret);
            set.delete(code); 
            if (set.size == 0) { 
                $('.hida.' + target).show();
            }
            session.fetch_data();
        }
    });


})

// on the resize of the window 
$(window).resize(() => { 
    session.refresh();
})
