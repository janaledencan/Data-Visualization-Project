// Set dimensions and margins for the chart
const margin = { top: 70, right: 30, bottom: 40, left: 80 };
const width = 1200 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const legendWidth = 150;

// Set up the x and y scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Create tooltip div
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

legend_data = [
    { "temp": "Zagreb", "primary": "#ef476f" },
    { "temp": "Split", "primary": "#899499" },
    { "temp": "Rijeka", "primary": "#118ab2" },
    { "temp": "Osijek", "primary": "#111111" },
];

// // Create the SVG element
// const svg = d3.select("#cities_temperature_chart")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);



// Load multiple JSON files using Promise.all
Promise.all([
    d3.json("data/zg_2022.json"),
    d3.json("data/st_2022.json"),
    d3.json("data/ri_2022.json"),
    d3.json("data/os_2022.json")
]).then(function (datasets) {
    // Parse the date and ensure tavg is a number for each dataset
    const parseDate = d3.timeParse("%Y-%m-%d");
    datasets.forEach(data => {
        data.forEach(d => {
            d.date = parseDate(d.date);
            d.tavg = +d.tavg;
        });
    });

    // Draw lines for each dataset's tavg values
    drawLines(datasets);
}).catch(function (error) {
    console.error('Error loading or processing data:', error);
});

// Function to draw lines for each dataset's tavg values
function drawLines(datasets) {
    // Create the SVG element
    const svg = d3.select("#cities_temperature_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    // .append("g")
    // .attr("transform", `translate(${margin.left},${margin.top})`);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const allDates = datasets.flatMap(data => data.map(d => d.date));
    x.domain(d3.extent(allDates));

    const allTavg = datasets.flatMap(data => data.map(d => d.tavg));
    y.domain([d3.min(allTavg), d3.max(allTavg)]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.tavg));

    const colors = d3.scaleOrdinal()
        .domain(datasets.map((_, i) => i))
        .range(["#EF476F", "#118AB2", "#06D6A0", "#C29D48"]);


    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${y(0)})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y));


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

    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", margin.left - 115)
        .attr("y", margin.top - 100)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("font-family", "sans-serif")
        .text("Average Temperatures in Croatian Cities 2022.");

    datasets.forEach((data, index) => {
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("class", "line")
            .attr("id", `line-${index}`)
            .attr("d", line)
            .style("stroke", colors(index));
    });

    function toggleLineVisibility(cityIndex) {
        const line = d3.select(`#line-${cityIndex}`);
        const currentOpacity = line.style("opacity");
        const legendItem = d3.select(`#legend3 .legend-item:nth-child(${cityIndex + 1}) p`);

        if (currentOpacity === "1") {
            line.style("opacity", "0");
            legendItem.classed("crossed-out", true);
        } else {
            line.style("opacity", "1");
            legendItem.classed("crossed-out", false);
        }
    }

    legend_data.forEach((city, index) => {
        d3.select(`#legend3 .legend-item:nth-child(${index + 1})`).on("click", () => {
            toggleLineVisibility(index);
        });
    });

    // Add a circle element for moving through the visualization
    const circle = svg.append("circle")
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("stroke", "white")
        .attr("opacity", .70)
        .style("pointer-events", "none");

    // Create a listening rectangle
    const listeningRect = svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    // Create the mouse move function
    listeningRect.on("mousemove", function (event) {
        const [xCoord] = d3.pointer(event, this);
        const x0 = x.invert(xCoord);

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
        const visibleDataPoints = dataPoints.filter(({ index }) => d3.select(`#line-${index}`).style("opacity") === "1");

        if (visibleDataPoints.length === 0) {
            tooltip.style("display", "none");
            return;
        }

        const xPos = x(visibleDataPoints[0].data.date);
        const yPos = y(visibleDataPoints[0].data.tavg);

        // Update the circle position
        circle.attr("cx", xPos)
            .attr("cy", yPos)
            .attr("r", 5);

        // Update the tooltip content
        const tooltipContent = visibleDataPoints.map(({ data, index }) => {
            return `<strong>${legend_data[index].temp}:</strong> ${data.tavg !== undefined ? data.tavg.toFixed(0) + '°C' : 'N/A'}`;
        }).join("<br>");

        // Show and position the tooltip
        tooltip.style("display", "block")
            .style("left", `${xPos + 100}px`)
            .style("top", `${yPos + 50}px`)
            .html(`<strong>Date:</strong> ${visibleDataPoints[0].data.date.toLocaleDateString()}<br>${tooltipContent}`);
    });

    // Listening rectangle mouse leave function
    listeningRect.on("mouseleave", function () {
        circle.transition()
            .duration(50)
            .attr("r", 0);

        tooltip.style("display", "none");
    });
}
