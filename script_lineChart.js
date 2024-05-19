// Set dimensions and margins for the chart

const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const legendWidth = 150;

// Set up the x and y scales

const x = d3.scaleTime()
    .range([0, width]);

const y = d3.scaleLinear()
    .range([height, 0]);

// Create the SVG element and append it to the chart container

const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);



legend_data = [
    { "temperature": "Maximum", "primary": "#ef476f" },
    { "temperature": "Average", "primary": "#899499" },
    { "temperature": "Minimum", "primary": "#118ab2" },
];



// // Load and Process Data

d3.json("data/os_2022.json").then(function (data) {

    // Parse the date and convert temperature to a number
    const parseDate = d3.timeParse("%Y-%m-%d");
    data.forEach(d => {
        d.date = parseDate(d.date);
        d.tavg = +d.tavg;
        d.tmax = +d.tmax;
        d.tmin = +d.tmin;
    });

    console.log(data)

    // Define the x and y domains

    x.domain(d3.extent(data, d => d.date));
    y.domain([-10, d3.max(data, d => d.tavg) + 2]);


    // Add the x-axis

    svg.append("g")
        .attr("transform", `translate(0,${height - 94})`)
        .style("font-size", "14px")
        .call(d3.axisBottom(x)
            .ticks(d3.timeMonth.every(1))  //tick on x for every month
            .tickFormat(d3.timeFormat("%b")));  //only name of the month




    // Add the y-axis

    svg.append("g")
        .style("font-size", "14px")
        .call(d3.axisLeft(y)
            .ticks((d3.max(data, d => d.tavg)) / 5)
            .tickPadding(10)
        )


    // // Add horizontal gridlines

    svg.selectAll("yGrid")
        .data(y.ticks((d3.max(data, d => d.tavg)) / 5).slice(1))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5)

    // Create the line generator

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tavg));

    const line2 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tmax));

    const line3 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tmin));


    // Add the line path to the SVG element

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#899499") //gray
        .attr("stroke-width", 1.5)
        .attr("d", line);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#ef476f") //red
        .attr("stroke-width", 1.5)
        .attr("d", line2);


    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#118ab2") //blue
        .attr("stroke-width", 1.5)
        .attr("d", line3);



    // // Add Y-axis label

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");

    // // Add the chart title

    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text("Temperatures in Osijek 2022.");

    // // Add the source credit

    svg.append("text")
        .attr("class", "source-credit")
        .attr("x", width - 1125)
        .attr("y", height + margin.bottom - 3)
        .style("font-size", "9px")
        .style("font-family", "sans-serif")
        .text("Source: https://meteostat.net/en/");


})



//legend   
discreteLegend({ labels: legend_data, nColumns: 1 });  //determining how many columns the data will be placed in

function discreteLegend({
    labels,
    nColumns = 1,
    colWidth = 200,
    keySize = 32,
    margin = 5,
    textLeft = 40,
    fontFamily = "Helvetica Neue, sans-serif",
    fontSize = 16
} = {}) {
    let keySpace = keySize / 3;
    let maxKeysPerCol = Math.ceil(labels.length / nColumns);
    let height = maxKeysPerCol * (keySize + keySpace + margin);
    let textTop = (keySize + keySpace) / 2;

    const svg = d3.select("#legend").append("svg")
        .attr("width", colWidth * nColumns)
        .attr("height", height)
        // .attr("width", legendWidth)
        // .attr("height", height)
        .attr("viewBox", [0, 0, legendWidth, height])
        .style("overflow", "visible")
        .style("display", "block");

    svg.append("g")
        .selectAll(".legendRect")
        .data(labels)
        .join("rect")
        .attr("class", "legendRect") // a class to the rectangles
        .attr("x", (d, i) => Math.floor(i / maxKeysPerCol) * colWidth)
        .attr("y", (d, i) => (i % maxKeysPerCol) * (keySize + keySpace))
        .attr("width", keySize)
        .attr("height", keySize)
        .attr("fill", d => d.primary);

    svg.append("g")
        .selectAll("text")
        .data(labels)
        .join("text")
        .attr("x", (d, i) => Math.floor(i / maxKeysPerCol) * colWidth + textLeft)
        .attr("y", (d, i) => (i % maxKeysPerCol) * (keySize + keySpace) + textTop)
        .attr("font-family", fontFamily)
        .attr("font-size", fontSize)
        .attr("fill", "black")
        .text(d => d.temperature); // d.temperature

    return svg.node();
}
