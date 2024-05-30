const margin2 = { top: 60, right: 60, bottom: 50, left: 60 };
const width2 = 900 - margin2.left - margin2.right;
const height2 = 500 - margin2.top - margin2.bottom;

// Parse the date / time
const parseDate2 = d3.timeParse("%Y-%m-%d");

selectedCity;
selectedYear;

// Set the ranges
const x2 = d3.scaleBand().range([0, width2]).padding(0.1);
const yTemp = d3.scaleLinear().range([height2, 0]);
const yPrcp = d3.scaleLinear().range([height2, 0]);

// Create the SVG canvas
const svg_climate = d3.select(".climate_chart").append("svg")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);


let dataForClimateChart = [];


function fetchDataForClimateChart() {

    d3.json(`data/${selectedCity}_${selectedYear}.json`).then(data => {

        // Format the data
        data.forEach(d => {
            d.date = parseDate2(d.date);
            d.tavg = +d.tavg;
            d.prcp = +d.prcp;
        });

        console.log(data)
        dataForClimateChart = data;
        console.log(dataForClimateChart)

        // Update the graph with the new data
        updateClimateGraph(dataForClimateChart);

    }).catch(function (error) {
        console.error('Error loading JSON data:', error);
    });
};

fetchDataForClimateChart();


function handleSelectChangeClimate() {
    selectedCity = d3.select("#selectButtonCity").property("value");
    selectedYear = d3.select("#selectButtonYear").property("value");
    fetchData();
    updateGraph(dataForTemperatureChart);
    fetchDataForClimateChart();
    updateClimateGraph(dataForClimateChart);
    console.log("Selected City: " + selectedCity);
    console.log("Selected Year: " + selectedYear);
}

// Attach the handleSelectChangeClimate function to the change event of both select menus

d3.select("#selectButtonYear").on("change", handleSelectChangeClimate);
d3.select("#selectButtonCity").on("change", handleSelectChangeClimate);

// Initialize the default values and update the graph
handleSelectChangeClimate();


function updateClimateGraph(data) {
    svg_climate.selectAll("*").remove();
    drawClimateChart(data);
}

function drawClimateChart(data) {

    console.log('Data climate chart in drawClimateChart:', data);

    // Aggregate data by month
    const monthlyData = d3.rollup(data,
        v => ({
            tavg: d3.mean(v, d => d.tavg),
            prcp: d3.sum(v, d => d.prcp)
        }),
        d => d3.timeMonth(d.date)
    );

    // Convert the aggregated data to an array
    const aggregatedData = Array.from(monthlyData, ([key, value]) => ({
        month: key,
        tavg: value.tavg,
        prcp: value.prcp
    }));

    // Sort data by month
    aggregatedData.sort((a, b) => d3.ascending(a.month, b.month));

    // Scale the range of the data
    x2.domain(aggregatedData.map(d => d.month));
    yTemp.domain([-10, 30]);
    yPrcp.domain([0, d3.max(aggregatedData, d => d.prcp) + 20]);  // to add 20 to the max height

    // Calculate zero temperature line position
    const zeroTempY = yTemp(0);

    // the chart title
    var city = cities.filter(city => city.value == selectedCity);
    console.log(city)

    // Title
    svg_climate.append("text")
        .attr("class", "chart-title")
        .attr("x", margin2.left - 115)
        .attr("y", margin2.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text(`Climate Chart ${city[0].text} ${selectedYear}.`);

    // Add the precipitation bars
    svg_climate.selectAll(".bar")
        .data(aggregatedData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x2(d.month))
        .attr("width", x2.bandwidth())
        .attr("y", d => zeroTempY - (height2 - yPrcp(d.prcp)))
        .attr("height", d => height2 - yPrcp(d.prcp))


    // Add the temperature line path
    const tempLine = d3.line()
        .x(d => x2(d.month) + x2.bandwidth() / 2)
        .y(d => yTemp(d.tavg));

    svg_climate.append("path")
        .datum(aggregatedData)
        .attr("class", "line")
        .attr("d", tempLine);

    // the X Axis
    svg_climate.append("g")
        .attr("transform", `translate(0,${zeroTempY})`)
        .call(d3.axisBottom(x2).tickFormat(d3.timeFormat("%b")))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width2 / 2)
        .attr("y", margin2.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Months");

    // the Y Axis (left for temperature)
    svg_climate.append("g")
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(yTemp).ticks(10))


    svg_climate.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin2.left)
        .attr("x", 0 - (height2 / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");


    // the Y Axis (right for precipitation)
    svg_climate.append("g")
        .attr("transform", `translate(${width2},${zeroTempY - height2})`)
        .call(d3.axisRight(yPrcp).ticks(10))


    svg_climate.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width2 + 30)
        .attr("x", -height2 / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Precipitation (mm)");

}
