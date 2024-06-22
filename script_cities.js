const margin3 = { top: 70, right: 30, bottom: 40, left: 80 };
const width3 = 1200 - margin3.left - margin3.right;
const height3 = 500 - margin3.top - margin3.bottom;
const legendWidth3 = 150;


const x3 = d3.scaleTime().range([0, width3]);
const y3 = d3.scaleLinear().range([height3, 0]);

//let selectedYear = "2022";

const svg_cities = d3.select("#cities_temperature_chart").append("svg")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom);

// Create tooltip div
const tooltip_cities = d3.select("#cities_temperature_chart")
    .append("div")
    .attr("class", "tooltip2")


const legend_data_cities = [
    { "temp": "Zagreb", "primary": "#ef476f" },
    { "temp": "Split", "primary": "#899499" },
    { "temp": "Rijeka", "primary": "#118ab2" },
    { "temp": "Osijek", "primary": "#111111" },
];

const parseDate = d3.timeParse("%Y-%m-%d");

let dataForCitiesChart = [];


function fetchDataForCitiesChart() {
    // Load multiple JSON files using Promise.all
    Promise.all([
        d3.json(`data/zg_${selectedYear}.json`),
        d3.json(`data/st_${selectedYear}.json`),
        d3.json(`data/ri_${selectedYear}.json`),
        d3.json(`data/os_${selectedYear}.json`)
    ]).then(function (datasets) {

        datasets.forEach(data => {
            data.forEach(d => {
                d.date = parseDate(d.date);
                d.tavg = +d.tavg;
            });
        });

        dataForCitiesChart = datasets;
        updateCitiesGraph(dataForCitiesChart);

    }).catch(function (error) {
        console.error('Error loading or processing data:', error);
    });
};

fetchDataForCitiesChart();

d3.select("#selectButtonYear").on("change", function () {
    selectedYear = this.value;
    fetchData();
    fetchDataForClimateChart();
    fetchDataForCitiesChart();
    updateGraph(dataForTemperatureChart);
    updateClimateGraph(dataForClimateChart);
    updateCitiesGraph(dataForCitiesChart);
    console.log("In city file: " + selectedYear);
});

function updateCitiesGraph(data) {
    drawLines(data);
}

// Function to draw lines for each dataset's tavg values
function drawLines(datasets) {

    svg_cities.selectAll("g").remove();
    const g = svg_cities.append("g").attr("transform", `translate(${margin3.left},${margin3.top})`);

    const allDates = datasets.flatMap(data => data.map(d => d.date));
    x3.domain(d3.extent(allDates));

    const allTavg = datasets.flatMap(data => data.map(d => d.tavg));
    y3.domain([-5, 35]);

    const line = d3.line()
        .x(d => x3(d.date))
        .y(d => y3(d.tavg));

    // Define colors for each line
    const colors = d3.scaleOrdinal()
        .domain(datasets.map((_, i) => i))
        .range(["#EF476F", "#118AB2", "#06D6A0", "#C29D48"]);

    // Draw the x-axis at y = 0
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${y3(0)})`)
        .call(d3.axisBottom(x3).tickFormat(d3.timeFormat("%b")));

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y3));


    g.selectAll(".yGrid")
        .data(y3.ticks(10))
        .enter()
        .append("line")
        .attr("class", "yGrid")
        .attr("x1", 0)
        .attr("x2", width3)
        .attr("y1", d => y3(d))
        .attr("y2", d => y3(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", .5);


    g.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin3.left)
        .attr("x", 0 - (height3 / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");


    g.append("text")
        .attr("class", "chart-title")
        .attr("x", margin3.left - 115)
        .attr("y", margin3.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text(`Average Temperatures in Croatian Cities ${selectedYear}`);

    // Bind the data
    const lines = g.selectAll(".line")
        .data(datasets);

    // Enter new lines
    lines.enter()
        .append("path")
        .attr("class", "line")
        .attr("id", (d, i) => `line-${i}`)
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .merge(lines)
        .attr("d", line)
        .style("stroke", (d, i) => colors(i));

    // Exit old lines
    lines.exit().remove();

    // Define a function to toggle the visibility of lines
    function toggleLineVisibility(cityIndex) {
        const line = d3.select(`#line-${cityIndex}`);
        const currentOpacity = line.style("opacity");
        line.style("opacity", currentOpacity === "1" ? "0" : "1");

        const legendItem = d3.select(`#legend3 .legend-item:nth-child(${cityIndex + 1}) p`);

        if (currentOpacity === "1") {
            line.style("opacity", "0");
            legendItem.classed("crossed-out", true);
        } else {
            line.style("opacity", "1");
            legendItem.classed("crossed-out", false);
        }
    }


    legend_data_cities.forEach((city, index) => {
        d3.select(`#legend3 .legend-item:nth-child(${index + 1})`).on("click", () => {
            toggleLineVisibility(index);
        });
    });

    // Add a circle element for moving through the visualization
    let circleCities = svg_cities.select("circle");
    if (circleCities.empty()) {
        circleCities = svg_cities.append("circle")
            .attr("r", 0)
            .attr("fill", "steelblue")
            .style("stroke", "white")
            .attr("opacity", .70)
            .style("pointer-events", "none")
            .attr("transform", `translate(${margin3.left},${margin3.top})`);
    }

    // Create a listening rectangle
    let listeningRectCities = svg_cities.select(".rect2");
    if (listeningRectCities.empty()) {
        listeningRectCities = svg_cities.append("rect")
            .attr("width", width3)
            .attr("height", height3)
            .attr("class", "rect2")
            .attr("transform", `translate(${margin3.left},${margin3.top})`)
            .style("fill", "none")
            .style("pointer-events", "all");
    }


    listeningRectCities.on("mousemove", function (event) {
        const [xCoord] = d3.pointer(event, this);
        const x0 = x3.invert(xCoord);

        // Find the closest data points for each dataset
        const bisectDate = d3.bisector(d => d.date).left;
        const dataPoints = datasets.map((data, index) => {
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            return { data: d, index };
        });

        // Filter out data points where the line is hidden
        const visibleDataPoints = dataPoints.filter(({ index }) => {
            const lineElement = document.getElementById(`line-${index}`);
            return lineElement && lineElement.style.opacity !== "0";
        });

        if (visibleDataPoints.length === 0) {
            tooltip_cities.style("display", "none");
            return;
        }

        const xPos = x3(visibleDataPoints[0].data.date);
        const yPos = y3(visibleDataPoints[0].data.tavg);

        // Update the circle position
        circleCities.attr("cx", xPos)
            .attr("cy", yPos)
            .attr("r", 5);

        // Update the tooltip content
        const tooltipContent = visibleDataPoints.map(({ data, index }) => {
            return `<strong>${legend_data_cities[index].temp}:</strong> ${data.tavg !== undefined ? data.tavg.toFixed(0) + '&#176;C' : 'N/A'}`;
        }).join("<br>");

        circleCities.transition()
            .duration(50)
            .attr("r", 5);

        // Show and position the tooltip
        tooltip_cities.style("display", "block")
            .style("left", `${xPos + 20}px`)
            .style("top", `${yPos + 1200}px`)
            .html(`<strong>Date:</strong> ${visibleDataPoints[0].data.date.toLocaleDateString()}<br>${tooltipContent}`);
    });

    // Listening rectangle mouse leave function
    listeningRectCities.on("mouseleave", function () {
        circleCities.transition()
            .duration(50)
            .attr("r", 0);

        tooltip_cities.style("display", "none");
    });


}