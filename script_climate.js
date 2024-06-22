
const margin2 = { top: 60, right: 60, bottom: 50, left: 60 };
const width2 = 900 - margin2.left - margin2.right;
const height2 = 500 - margin2.top - margin2.bottom;

// Parse the date / time
const parseDate2 = d3.timeParse("%Y-%m-%d");


const x2 = d3.scaleBand().range([0, width2]).padding(0.1);
const yTemp = d3.scaleLinear().range([height2, 0]);
const yPrcp = d3.scaleLinear().range([height2, 0]);


const svg_climate = d3.select(".climate_chart").append("svg")
    .attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

let dataForClimateChart = [];


function fetchDataForClimateChart() {
    if (!selectedCity || !selectedYear) {
        return;
    }

    d3.json(`data/${selectedCity}_${selectedYear}.json`).then(data => {
        data.forEach(d => {
            d.date = parseDate2(d.date);
            d.tavg = +d.tavg;
            d.prcp = +d.prcp;
        });

        dataForClimateChart = data;
        updateClimateGraph(dataForClimateChart);
    }).catch(error => {
        console.error('Error loading JSON data:', error);
    });
}

// Handle the selection change for city and year
function handleSelectChangeClimate() {
    selectedCity = d3.select("#selectButtonCity").property("value");
    selectedYear = d3.select("#selectButtonYear").property("value");

    fetchData();
    fetchDataForClimateChart();
    updateGraph(dataForTemperatureChart);
    updateClimateGraph(dataForClimateChart);
    console.log("Selected City: " + selectedCity);
    console.log("Selected Year: " + selectedYear);

}

// event listeners for the select buttons
d3.select("#selectButtonYear").on("change", handleSelectChangeClimate);
d3.select("#selectButtonCity").on("change", handleSelectChangeClimate);

// Function to update the climate graph
function updateClimateGraph(data) {
    // Aggregate data by month
    const monthlyData = d3.rollup(data,
        v => ({
            tavg: d3.mean(v, d => d.tavg),
            prcp: d3.sum(v, d => d.prcp)
        }),
        d => d3.timeMonth(d.date)
    );

    const aggregatedData = Array.from(monthlyData, ([key, value]) => ({
        month: key,
        tavg: value.tavg,
        prcp: value.prcp
    }));

    // Sort data by month
    aggregatedData.sort((a, b) => d3.ascending(a.month, b.month));


    x2.domain(aggregatedData.map(d => d.month));
    yTemp.domain([-10, 30]);
    yPrcp.domain([0, d3.max(aggregatedData, d => d.prcp) + 20]);

    // Calculate zero temperature line position
    const zeroTempY = yTemp(0);


    const city = cities.find(city => city.value == selectedCity);
    if (city) {
        const title = `Climate Chart ${city.text} ${selectedYear}`;

        const chartTitle = svg_climate.selectAll(".chart-title")
            .data([title]);

        chartTitle.enter()
            .append("text")
            .attr("class", "chart-title")
            .attr("x", margin2.left - 115)
            .attr("y", margin2.top - 100)
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .style("font-family", "sans-serif")
            .merge(chartTitle)
            .text(title);

        chartTitle.exit().remove();
    } else {
        console.error(`City with value ${selectedCity} not found in cities array`);
    }

    // Update the precipitation bars
    const bars = svg_climate.selectAll(".bar")
        .data(aggregatedData);

    bars.enter().append("rect")
        .attr("class", "bar")
        .merge(bars)
        .attr("x", d => x2(d.month))
        .attr("width", x2.bandwidth())
        .attr("y", d => zeroTempY - (height2 - yPrcp(d.prcp)))
        .attr("height", d => height2 - yPrcp(d.prcp));

    bars.exit().remove();

    // Update the temperature line path
    const tempLine = d3.line()
        .x(d => x2(d.month) + x2.bandwidth() / 2)
        .y(d => yTemp(d.tavg));

    const linePath = svg_climate.selectAll(".line")
        .data([aggregatedData]);

    linePath.enter().append("path")
        .attr("class", "line")
        .merge(linePath)
        .attr("d", tempLine);

    linePath.exit().remove();

    // Update the X Axis
    const xAxis = svg_climate.selectAll(".x-axis")
        .data([null]);

    xAxis.enter()
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${zeroTempY})`)
        .merge(xAxis)
        .call(d3.axisBottom(x2).tickFormat(d3.timeFormat("%b")))
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width2 / 2)
        .attr("y", margin2.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Months");

    xAxis.exit().remove();

    // Update the Y Axis (left for temperature)
    const yAxisTemp = svg_climate.selectAll(".y-axis-temp")
        .data([null]);

    yAxisTemp.enter()
        .append("g")
        .attr("class", "y-axis-temp")
        .merge(yAxisTemp)
        .call(d3.axisLeft(yTemp).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin2.left)
        .attr("x", 0 - (height2 / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#ef476f")
        .style("font-family", "sans-serif")
        .text("Temperature (°C)");

    yAxisTemp.exit().remove();

    // Update the Y Axis (right for precipitation)
    const yAxisPrcp = svg_climate.selectAll(".y-axis-prcp")
        .data([null]);

    yAxisPrcp.enter()
        .append("g")
        .attr("class", "y-axis-prcp")
        .attr("transform", `translate(${width2},${zeroTempY - height2})`)
        .merge(yAxisPrcp)
        .call(d3.axisRight(yPrcp).ticks(10))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width2 + 30)
        .attr("x", -height2 / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#118ab2")
        .style("font-family", "sans-serif")
        .text("Precipitation (mm)");

    yAxisPrcp.exit().remove();
}

handleSelectChangeClimate();