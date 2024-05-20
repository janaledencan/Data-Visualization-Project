// List of groups 
var cities = ["Zagreb", "Split", "Rijeka", "Osijek"]
var years = ["2022", "2023"];

// add the options to the button
d3.select("#selectButtonCity")
    .selectAll('myOptions')
    .data(cities)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button


d3.select("#selectButtonYear")
    .selectAll('myOptions')
    .data(years)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 
