const margin3 = { top: 70, right: 30, bottom: 40, left: 80 };
const width3 = 1200 - margin3.left - margin3.right;
const height3 = 500 - margin3.top - margin3.bottom;
const legendWidth3 = 150;


const x3 = d3.scaleTime()
    .range([0, width3]);

const y3 = d3.scaleLinear()
    .range([height3, 0]);


selectedCity = "zg";
selectedYear = "2022";

const svg_cities = d3.select("#cities_temperature_chart").append("svg")
    .attr("width", width3 + margin3.left + margin3.right)
    .attr("height", height3 + margin3.top + margin3.bottom);


// create tooltip div
const tooltip_cities = d3.select("#cities_temperature_chart")
    .append("div")
    .attr("class", "tooltip2")


legend_data_cities = [
    { "temp": "Zagreb", "primary": "#ef476f" },
    { "temp": "Split", "primary": "#899499" },
    { "temp": "Rijeka", "primary": "#118ab2" },
    { "temp": "Osijek", "primary": "#111111" },
];

// Parse the date and ensure tavg is a number for each dataset
const parseDate = d3.timeParse("%Y-%m-%d");

let dataForCitiesChart = [];

// Load and Process Data
function fetchDataForCitiesChart() {
    // Load multiple JSON files 
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
        console.log(datasets);
        dataForCitiesChart = datasets;
        console.log(dataForCitiesChart);

        // Update the graph with the new data
        updateCitiesGraph(dataForCitiesChart);

    }).catch(function (error) {
        console.error('Error loading or processing data:', error);
    });
};

fetchDataForCitiesChart();

d3.select("#selectButtonYear").on("change", function () {
    selectedYear = this.value;
    fetchData();
    updateGraph(dataForTemperatureChart);
    fetchDataForClimateChart();
    updateClimateGraph(dataForClimateChart);
    fetchDataForCitiesChart();
    updateCitiesGraph(dataForCitiesChart);
    console.log("U city fileu" + selectedYear);
});


function updateCitiesGraph(data) {

    svg_cities.selectAll("*").remove();
    drawLines(data);
}

// Function to draw lines for each dataset's tavg values

function drawLines(datasets) {

    const g = svg_cities.append("g").attr("transform", `translate(${margin3.left},${margin3.top})`);

    // Combine all dates to set the x domain
    const allDates = datasets.flatMap(data => data.map(d => d.date));
    x3.domain(d3.extent(allDates));

    // Combine all tavg values to set the y domain
    const allTavg = datasets.flatMap(data => data.map(d => d.tavg));
    y3.domain([d3.min(allTavg), d3.max(allTavg)]);


    // Create line generators for each dataset
    const line = d3.line()
        .x(d => x3(d.date))
        .y(d => y3(d.tavg));

    // Define colors for each line
    const colors = d3.scaleOrdinal()
        .domain(datasets.map(d => d))
        .range(["#EF476F", "#118AB2", "#06D6A0", "#C29D48"]);


    // Draw the axes
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${y3(0)})`)
        .call(d3.axisBottom(x3));


    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y3));

    // Add horizontal gridlines
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


    // Y-axis label

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin3.left)
        .attr("x", 0 - (height3 / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#777")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");

    // the chart title

    g.append("text")
        .attr("class", "chart-title")
        .attr("x", margin3.left - 115)
        .attr("y", margin3.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text(`Average Temperatures in Croatian Cities ${selectedYear}.`);


    // Draw a line for each dataset
    datasets.forEach((data, index) => {
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("class", "line")
            .attr("id", `line-${index}`)  // Add a unique ID for each line
            .attr("d", line)
            .style("stroke", colors(index));
    });


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

    // Attach event listeners to legend items
    legend_data_cities.forEach((city, index) => {
        d3.select(`#legend3 .legend-item:nth-child(${index + 1})`).on("click", () => {
            toggleLineVisibility(index);
        });
    });

    // Add a circle element for moving through the visualization
    const circleCities = svg_cities.append("circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", .70)
        .style("pointer-events", "none")
        .attr("transform", `translate(${margin3.left},${margin3.top})`);


    // Create a listening rectangle
    const listeningRectCities = svg_cities.append("rect")
        .attr("width", width3)
        .attr("height", height3)
        .attr("class", "rect2")
        .attr("transform", `translate(${margin3.left},${margin3.top})`);



    // Create the mouse move function
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
            return { data: d, index: index };
        });

        // Filter out hidden lines
        const visibleDataPointsCities = dataPoints.filter(({ index }) => d3.select(`#line-${index}`).style("opacity") === "1");


        if (visibleDataPointsCities.length === 0) {
            tooltip_cities.style("display", "none");
            return;
        }

        const xPosCities = x3(visibleDataPointsCities[0].data.date);
        const yPosCities = y3(visibleDataPointsCities[0].data.tavg);

        // Update the circle position
        circleCities.attr("cx", xPosCities)
            .attr("cy", yPosCities)
            .attr("r", 5);

        // Update the tooltip content
        const tooltipContentCities = visibleDataPointsCities.map(({ data, index }) => {
            return `<strong>${legend_data_cities[index].temp}:</strong> ${data.tavg !== undefined ? data.tavg.toFixed(0) + '&#176;C' : 'N/A'}`;
        }).join("<br>");


        circleCities.transition()
            .duration(50)
            .attr("r", 5);

        // Show and position the tooltip
        tooltip_cities.style("display", "block")
            .style("left", `${xPosCities + 20}px`)
            .style("top", `${yPosCities + 1200}px`)
            .html(`<strong>Date:</strong> ${visibleDataPointsCities[0].data.date.toLocaleDateString()}<br>${tooltipContentCities}`);
    });


    // Listening rectangle mouse leave function
    listeningRectCities.on("mouseleave", function () {
        circleCities.transition()
            .duration(50)
            .attr("r", 0);

        tooltip_cities.style("display", "none");
    });

}
