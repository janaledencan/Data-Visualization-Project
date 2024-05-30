
let selectedCity = "zg";
let selectedYear = "2022";

// List of groups ( one group per column)
var cities = [
    { text: "Zagreb", value: "zg" },
    { text: "Split", value: "st" },
    { text: "Rijeka", value: "ri" },
    { text: "Osijek", value: "os" },
];
var years = ["2022", "2023"];

// add the options to the button
d3.select("#selectButtonCity")
    .selectAll('myOptions')
    .data(cities)
    .enter()
    .append('option')
    .text(function (d) { return d.text })
    .attr("value", function (d) { return d.value; });


d3.select("#selectButtonYear")
    .selectAll('myOptions')
    .data(years)
    .enter()
    .append('option')
    .text(function (d) { return d; }) // text showed in the menu
    .attr("value", function (d) { return d; }) // corresponding value returned by the button
