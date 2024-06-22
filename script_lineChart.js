const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const legendWidth = 150;


const x = d3.scaleTime()
    .range([0, width]);

const y = d3.scaleLinear()
    .range([height, 0]);

selectedCity;
selectedYear;



const svg_temperature = d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


// Parse the date and convert temperature to a number
const parseDate1 = d3.timeParse("%Y-%m-%d");

let dataForTemperatureChart = [];

// create tooltip div
const tooltip_temperature = d3.select("#chart-container")
    .append("div")
    .attr("class", "tooltip")


legend_data_temperature = [
    { "temperature": "Maximum", "primary": "#ef476f" },
    { "temperature": "Average", "primary": "#899499" },
    { "temperature": "Minimum", "primary": "#118ab2" },
];


function fetchData() {
    d3.json(`data/${selectedCity}_${selectedYear}.json`).then(function (data) {
        data.forEach(d => {
            d.date = parseDate1(d.date);
            d.tavg = +d.tavg;
            d.tmax = +d.tmax;
            d.tmin = +d.tmin;
        });
        console.log(data);
        dataForTemperatureChart = data;
        console.log(dataForTemperatureChart);

        // Update the graph with the new data
        updateGraph(dataForTemperatureChart, cities, selectedCity, selectedYear);

    }).catch(function (error) {
        console.error('Error loading JSON data:', error);
    });
}

fetchData();

let changeTimeout;

function updateGraph(data, cities, selectedCity, selectedYear) {
    drawTemperatureChart(data, cities, selectedCity, selectedYear);
}

function drawTemperatureChart(data, cities, selectedCity, selectedYear) {

    x.domain(d3.extent(data, d => d.date));
    y.domain([-10, d3.max(data, d => d.tavg) + 2]);

    const xAxis = svg_temperature.selectAll(".x-axis")
        .data([null]);

    xAxis.enter()
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - 94})`)
        .style("font-size", "14px")
        .merge(xAxis)
        .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));


    const yAxis = svg_temperature.selectAll(".y-axis")
        .data([null]);

    yAxis.enter()
        .append("g")
        .attr("class", "y-axis")
        .style("font-size", "14px")
        .merge(yAxis)
        .call(d3.axisLeft(y).ticks((d3.max(data, d => d.tavg)) / 5).tickPadding(10));

    // Update horizontal gridlines
    const gridLines = svg_temperature.selectAll(".y-grid")
        .data(y.ticks((d3.max(data, d => d.tavg)) / 5).slice(1));

    gridLines.enter()
        .append("line")
        .attr("class", "y-grid")
        .merge(gridLines)
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);

    gridLines.exit().remove();


    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tavg));

    const line2 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tmax));

    const line3 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tmin));

    // Update the lines
    updateLine(data, line, "average-line", "#899499"); // average temperature line
    updateLine(data, line2, "max-line", "#ef476f"); // maximum temperature line
    updateLine(data, line3, "min-line", "#118ab2"); // minimum temperature line

    function updateLine(data, lineGenerator, className, color) {
        const path = svg_temperature.selectAll(`.${className}`)
            .data([data]);

        path.enter()
            .append("path")
            .attr("class", className)
            .merge(path)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("d", lineGenerator);

        path.exit().remove();
    }

    // Update the circle element for moving through visualization
    const circle = svg_temperature.selectAll(".hover-circle")
        .data([null]);

    circle.enter()
        .append("circle")
        .attr("class", "hover-circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", .70)
        .style("pointer-events", "none")
        .merge(circle);


    const listeningRect = svg_temperature.selectAll(".listening-rect")
        .data([null]);

    listeningRect.enter()
        .append("rect")
        .attr("class", "listening-rect")
        .attr("width", width)
        .attr("height", height)
        .merge(listeningRect)
        .on("mousemove", function (event) {
            const [xCoord] = d3.pointer(event, this);
            const bisectDate = d3.bisector(d => d.date).left;
            const x0 = x.invert(xCoord);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            const xPos = x(d.date);
            const yPos = y(d.tavg);

            circle.attr("cx", xPos)
                .attr("cy", yPos);

            circle.transition()
                .duration(50)
                .attr("r", 5);

            tooltip_temperature
                .style("display", "block")
                .style("left", `${xPos + 100}px`)
                .style("top", `${yPos + 50}px`)
                .html(`<strong>${d.date.toLocaleDateString()}</strong> 
                <br><strong>Temperature</strong>
                <br><strong>Max:</strong> ${d.tmax !== undefined ? (d.tmax).toFixed(0) + '°C' : 'N/A'}
                <br><strong>Avg:</strong> ${d.tavg !== undefined ? (d.tavg).toFixed(0) + '°C' : 'N/A'}
                <br><strong>Min:</strong> ${d.tmin !== undefined ? (d.tmin).toFixed(0) + '°C' : 'N/A'}`);
        })
        .on("mouseleave", function () {
            circle.transition()
                .duration(50)
                .attr("r", 0);

            tooltip_temperature.style("display", "none");
        });

    listeningRect.exit().remove();


    const yAxisLabel = svg_temperature.selectAll(".y-axis-label")
        .data([null]);

    yAxisLabel.enter()
        .append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)")
        .merge(yAxisLabel);

    // Update the chart title
    const chartTitle = svg_temperature.selectAll(".chart-title")
        .data([null]);

    chartTitle.enter()
        .append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .merge(chartTitle)
        .text(`Temperatures in ${cities.find(city => city.value === selectedCity).text} ${selectedYear}.`);


    const sourceCredit = svg_temperature.selectAll(".source-credit")
        .data([null]);

    sourceCredit.enter()
        .append("text")
        .attr("class", "source-credit")
        .attr("x", width - 1125)
        .attr("y", height + margin.bottom - 3)
        .style("font-size", "9px")
        .style("font-family", "sans-serif")
        .merge(sourceCredit)
        .text("Source: https://meteostat.net/en/");
}


//legend   
discreteLegend({ labels: legend_data_temperature, nColumns: 1 });  //determining how many columns the data will be placed in

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

    const svg_temperature = d3.select("#legend").append("svg")
        .attr("width", colWidth * nColumns)
        .attr("height", height)
        // .attr("width", legendWidth)
        // .attr("height", height)
        .attr("viewBox", [0, 0, legendWidth, height])
        .style("overflow", "visible")
        .style("display", "block");

    svg_temperature.append("g")
        .selectAll(".legendRect")
        .data(labels)
        .join("rect")
        .attr("class", "legendRect") // a class to the rectangles
        .attr("x", (d, i) => Math.floor(i / maxKeysPerCol) * colWidth)
        .attr("y", (d, i) => (i % maxKeysPerCol) * (keySize + keySpace))
        .attr("width", keySize)
        .attr("height", keySize)
        .attr("fill", d => d.primary);

    svg_temperature.append("g")
        .selectAll("text")
        .data(labels)
        .join("text")
        .attr("x", (d, i) => Math.floor(i / maxKeysPerCol) * colWidth + textLeft)
        .attr("y", (d, i) => (i % maxKeysPerCol) * (keySize + keySpace) + textTop)
        .attr("font-family", fontFamily)
        .attr("font-size", fontSize)
        .attr("fill", "black")
        .text(d => d.temperature); // d.temperature

    return svg_temperature.node();
}
