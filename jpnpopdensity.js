/*
    File: jpnpopdensity.js
    This is the main file using geomapping, particularly TopoJSON. It uses a TopoJSON file
    from GADM (https://gadm.org/index.html), popularity density data from Stats-Japan 
    (https://stats-japan.com/t/kiji/13400) to create a population density visualization.
    
    Code sourced from: (1) Ravina Gelda, CSE 163 TA, (2) Mike Bostock's California
    Population Density Map (https://bl.ocks.org/mbostock/5562380), and (3) The 
    textbook, Interactive Data Visualization for the Web by Scott Murray (chapter
    14).
*/

// create margins for map
var margin = {top: 20, right: 30, bottom: 30, left: 80},
    width = 1060 - margin.left - margin.right,
    height = 660 - margin.top - margin.bottom;

// select projection object, using geoMercator()
var projection = d3.geoMercator()
    .center([147, 38]) //this is where japan is 
    .scale([1500]);

// create path object to create path from coordinates in json file
var path = d3.geoPath()
    .projection(projection);

// taken from mbostock's code, use a blue-purple gradient with
// these thresholds.
var color = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeBuPu[9]);

// create x scale for our legend
var x = d3.scaleSqrt()
    .domain([30, 6000])
    .rangeRound([450, 900]);

// make an svg for our map, append to body for later use
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// call in our population density data...
d3.csv("japanpopdensity.csv").then(function(data){
    
    // then call in our json data as well   
    d3.json("jpntopo.json").then(function(json) {
        /* TOPOJSON: let's match up the .csv and .json files! this
         variable helps us easily locate the region names in the
         file, as there are a lot of properties. */
        var geo = json.objects.gadm36_JPN_1.geometries;

        /* taken from textbook. first, loop through density data
         that has our regions + density to assign a density
         property to our json values as well. */
        for(var i =0; i < data.length; i++){
            // get region name
            var region = data[i].region;

            // get density as a float
            var dataVal = parseFloat(data[i].density);

            /* now, let's loop through our json file. here, using the
             array we defined earlier, we're looping through it
             and we're trying to extract the region name, located in
             the NAME_1 variable.*/
            for(j = 0; j < geo.length; j++){
                // store name in a variable
                var jsonState = geo[j].properties.NAME_1;

                /* if the region we got earlier from our .csv is the same
                 as the one in our jsonState, add a density property
                 to the json file with the .csv value. */
                if (region == jsonState) {
                    geo[j].properties.density = dataVal;
                    // break out of the loop, as we got what we wanted!
                    break;
                }
            } //end inner loop

        } //end outer loop
        
        // position legend
        var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(50,40)");

        // use our color scale to get the color range we want, and create
        // our legend rectangle scaled appropriately with the densities
        g.selectAll("rect")
            .data(color.range().map(function(d) {
            d = color.invertExtent(d);
            if (d[0] == null) d[0] = x.domain()[0];
            if (d[1] == null) d[1] = x.domain()[1];
            return d;
        }))
            .enter().append("rect")
            .attr("height", 8)
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("fill", function(d) { return color(d[0]); });

        // define tick size, remove x domain line
        g.call(d3.axisBottom(x)
        .tickSize(15)
        .tickValues(color.domain()))
        .select(".domain")
        .remove();

        // legend label. note that it's in km!
        g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square kilometer");

        /*  here is where we're actually using SVG to draw our paths. our data
            is in the form of json under its features, so we access the json 
            objects and its properties to create the paths.
         */
        svg.append("g")
        .selectAll("path")
        .data(topojson.feature(json, json.objects.gadm36_JPN_1).features)
        .enter().append("path")
        .attr("fill", function(d) { 
            /* scale the density based on our color scale, using our new
             density property we added earlier! */
            return color(d.properties.density); }) 
        .attr("d", path);

    }) //end json
    
});//end csv