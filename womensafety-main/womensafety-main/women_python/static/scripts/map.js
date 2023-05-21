// Function for Side Bar
var hamburger = document.querySelector(".hamburger");
hamburger.addEventListener("click", function(){
    document.querySelector("body").classList.toggle("active");
})



// map.on('load', function() {


 


//     map.addLayer({
//       "id": "rating",
//       "type": "symbol",
//       "source": "points",
//       "layout": {
//         "icon-image": "{icon}-15",
//         "text-field": "{title}",
//         "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
//         "text-offset": [0, 0.6],
//         "text-anchor": "top"
//       }
//     });
//   });



map.on('load', () => {

    map.addSource('suburbs',{
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'

    })


    // map.addLayer({

    //     id: 'police_station',
    //     type: 'circle',
    //     source: 'suburbs',
    //     'source-layer': 'poi_label',
    //     filter: ['==',['get','category_en'],'Police'],
    //     "paint": {
    //         "circle-radius": 15,
    //         "circle-color": colour = '#36f202',
            
    //       },          

    // })


   
    filterarr = ["any",]
    for(i = 0; i<posts.length; i++){

        filterarr.push(['==',['get','name'],posts[i][0]])

    }


    

    // map.addLayer({
    //     id: 'terrain-data',
    //     type: 'heatmap',
    //     source: 'suburbs',
    //     'source-layer': 'place_label',

//        filter: filterarr ,
        
        
            
    // });


    

    for(i = 0;i<posts.length;i++){

        if (posts[i][2] <1){
            colour = '#f00000'
        }
        else if (posts[i][2] <2){

            colour = '#f66a13'
        }
        else if (posts[i][2] <3){

            colour = '#f2ca02'
        }
        else if (posts[i][2] <4){

            colour = '#aef202'
        }
        else{

            colour = '#36f202'
        }

       
        
        map.addLayer({

            id: posts[i][0],
            type: 'circle',
            source: 'suburbs',
            'source-layer': 'place_label',
            filter: ['==',['get','name'],posts[i][0]],
            "paint": {
                "circle-radius": 30,
                "circle-color": colour,
                "circle-opacity": 0.5
              },          
            // description: 'hello'
            metadata: "<br>Average Rating: "  +  posts[i][2] + "/5 " + "<br>Last Post Title: " + posts[i][1] + "<br> Last Post Content: " + posts[i][3]

        })

        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
            });
        


        map.on('mouseenter', posts[i][0],(e) => {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';
             
            // Copy coordinates array.
            const coordinates = e.features[0].geometry.coordinates.slice();

            
            
            const description = e.features[0].layer.id + "\n" + e.features[0].layer.metadata;
             
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
             
            // Populate the popup and set its coordinates
            // based on the feature found.
            
            popup.setLngLat(coordinates).setHTML(description).addTo(map);
            });
             
            map.on('mouseleave', posts[i][0], () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
            });
    }


    
});


